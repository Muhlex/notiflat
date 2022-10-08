import sanitizeHtml from "sanitize-html";
import { parse } from "node-html-parser";
import { toInt, fetchHtmlRetry, schedule } from "./shared";
import { sendListing } from "./notify";

import config from "./config.json";

function parseHtml(html?: string): Listing[] {
	if (!html) return [];

	const sanitizedStr = sanitizeHtml(html, { allowedAttributes: false });
	const root = parse(sanitizedStr);
	const items = root.querySelectorAll("#srchrslt-adtable .aditem");
	return items.filter(item => item.getAttribute("data-adid")).map((item): Listing => {
		const tags = item.querySelectorAll(".simpletag.tag-small").map(tag => tag.textContent);
		return {
			id: item.getAttribute("data-adid") as string,
			title: item.querySelector(".ellipsis")?.textContent.trim(),
			desc: item.querySelector(".aditem-main--middle--description")?.textContent.replaceAll("\n", " ").trim(),
			location: item.querySelector(".aditem-main--top--left")?.textContent.replace(/\s+/g, " ").trim(),
			price: {
				base: toInt(item.querySelector(".aditem-main--middle--price-shipping--price")?.textContent),
			},
			img: item.querySelector(".imagebox")?.getAttribute("data-imgsrc")?.replace("rule=$_2.JPG", "rule=$_20.JPG"),
			size: tags[0] ? parseInt(tags[0]) : undefined,
			rooms: tags[1] ? parseInt(tags[1]) : undefined,
			url: item.getAttribute("data-href") && ("https://ebay-kleinanzeigen.de" + item.getAttribute("data-href")),
			platform: "ebay"
		};
	});
}

async function getDetails(listing: Listing) {
	if (!listing.url) return;
	const html = await fetchHtmlRetry(listing.url);
	if (!html) return;

	const root = parse(html);
	const details = Object.fromEntries(root.querySelectorAll(".addetailslist .addetailslist--detail").map(el => {
		return [el.firstChild.textContent.trim().toLowerCase(), el.querySelector("span")?.textContent.trim() ];
	}));
	const parseDate = (input?: string | number) => {
		if (!input) return undefined;

		if (typeof input === "number") {
			return new Date(new Date().getFullYear(), input);
		}

		const months = [
			"Januar", "Februar", "März", "April",
			"Mai", "Juni", "Juli", "August",
			"September", "Oktober", "November", "Dezember",
		];
		const split = input.split(" ");
		const year = split.at(-1);
		if (!year) return undefined;
		const monthName = split.length === 2 ? split[0] : undefined;
		if (!monthName) return new Date(parseInt(year), 0, 1);
		return new Date(parseInt(year), months.indexOf(monthName), 1);
	};

	const descEl = root.querySelector("#viewad-description-text");
	if (descEl) descEl.innerHTML = descEl.innerHTML.replace(/(<br>|\s)+/g, " ");
	const desc = descEl?.textContent.trim();
	if (!listing.desc || (desc && desc.length > listing.desc.length)) listing.desc = desc;
	if (!listing.price) listing.price = {};
	listing.price.total = toInt(details["warmmiete"]);
	listing.terms = { start: parseDate(details["verfügbar ab"] || toInt(details["verfügbar ab monat"])) };
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

	for (let i = 0, listing = listings[i]; i < listings.length ; i++) {
		if (!knownIds.has(listing.id)) {
			if (config.detailed) await getDetails(listing);
			sendListing(listing);
			knownIds.add(listing.id);
		} else if (i >= 4) { // should always be after "TOP" items
			// prevent "new" items at the end of the list from triggering (old items that shifted up)
			break;
		}
	}
}

export function init(href: string) {
	schedule(() => update(href), { min: 20 * 1000, max: 40 * 1000 });
}
