import { parse } from "node-html-parser";
import { toInt, fetchHtmlRetry, schedule } from "./shared";
import { sendListing } from "./notify";

import config from "./config.json";

function parseHtml(html?: string): Listing[] {
	if (!html) return [];

	const root = parse(html);
	const items = root.querySelectorAll("#main_column .wgg_card.offer_list_item");
	return items.filter(item => item.getAttribute("data-id")).map((item): Listing => {
		const details = item.querySelector(".card_body .col-xs-11 span")?.textContent.replace(/\s+/g, " ").trim().split(" | ") || [];
		return {
			id: item.getAttribute("data-id") as string,
			title: item.querySelector(".truncate_title")?.textContent.trim(),
			desc: undefined,
			location: details[2] ? `${details[2]}, ${details[1]}` : details[1],
			price: {
				total: toInt(item.querySelector(".middle b")?.textContent)
			},
			img: (str => {
				const url = str && /background-image:\s*url\((.*?)\)/.exec(str);
				return url && url[1].replace(".small.", ".large.") || undefined;
			})(item.querySelector(".card_image a")?.getAttribute("style")),
			size: toInt(item.querySelector(".middle .text-right")?.textContent),
			rooms: details[0] ? parseInt(details[0]) : undefined,
			url: (str => str && "https://www.wg-gesucht.de" + str)(item.querySelector(".truncate_title a")?.getAttribute("href")),
			platform: "wg-gesucht"
		};
	});
}

async function getDetails(listing: Listing) {
	if (!listing.url) return;
	const html = await fetchHtmlRetry(listing.url);
	if (!html) return;

	const root = parse(html);
	const row = root.querySelector(".panel-body .row:nth-child(6)");
	const terms = row?.querySelectorAll(".col-sm-3 p b")
		.filter(el => !el.classList.contains("noprint"))
		.map(el => el.textContent);
	const parseDate = (string: string) => {
		const [d, m, y] = string.split(".");
		return new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
	};

	const descEl = root.querySelector("#ad_description_text");
	if (descEl) {
		[...descEl.querySelectorAll(".noprint"), ...descEl.querySelectorAll("h3")].forEach(el => el.remove());
	}
	listing.desc = descEl?.textContent.replaceAll(/\s+/g, " ").trim();
	if (!listing.price) listing.price = {};
	listing.price.base = toInt(row?.querySelector("table tr td + td")?.textContent);
	listing.price.deposit = toInt(row?.querySelector("table tr:nth-child(4) td + td")?.textContent);
	const start = terms && terms[0] ? parseDate(terms[0]) : undefined;
	const end = terms && terms[1] ? parseDate(terms[1]) : undefined;
	listing.terms = terms && { start, end };
}

const cache = {
	knownIds: new Set<string>()
};

async function update(href: string) {
	const listings = parseHtml(await fetchHtmlRetry(href));
	if (listings.length === 0) return;

	const knownIds = cache.knownIds;
	if (knownIds.size === 0) {
		for (const { id } of listings) {
			knownIds.add(id);
		}
		return;
	}

	for (const listing of listings) {
		if (!knownIds.has(listing.id)) {
			if (config.detailed) await getDetails(listing);
			sendListing(listing);
			knownIds.add(listing.id);
		} else {
			// prevent "new" items at the end of the list from triggering (old items that shifted up)
			break;
		}
	}
}

export function init(href: string) {
	schedule(() => update(href), { min: 20 * 1000, max: 40 * 1000 });
}
