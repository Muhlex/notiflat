import { fetchHtml, schedule } from "./shared";
import { logListing, sendListing } from "./notify";

import { parse } from "node-html-parser";

const TYPE = "wg-gesucht";

function parseHtml(string?: string): Listing[] {
	if (!string) {
		return [];
	}

	const html = parse(string);
	const items = html.querySelectorAll("#main_column .wgg_card.offer_list_item");
	return items.filter(item => item.getAttribute("data-id")).map((item): Listing => {
		const details = item.querySelector(".card_body .col-xs-11 span")?.textContent.replace(/\s+/g, " ").trim().split(" | ") || [];
		return {
			id: item.getAttribute("data-id") as string,
			title: item.querySelector(".truncate_title")?.textContent.trim(),
			desc: undefined,
			location: details[2] ? `${details[2]}, ${details[1]}` : details[1],
			price: (str => str ? parseInt(str) : undefined)(item.querySelector(".middle b")?.textContent),
			img: (str => {
				const url = str && /background-image:\s*url\((.*?)\)/.exec(str);
				return url && url[1].replace(".small.", ".large.") || undefined;
			})(item.querySelector(".card_image a")?.getAttribute("style")),
			size: (str => str ? parseInt(str) : undefined)(item.querySelector(".middle .text-right")?.textContent),
			rooms: details[0] ? parseInt(details[0]) : undefined,
			url: (str => str && "https://www.wg-gesucht.de/" + str)(item.querySelector(".truncate_title a")?.getAttribute("href")),
			type: TYPE
		};
	});
}

const cache = {
	knownIds: new Set<string>()
};

async function update(href: string) {
	const listings = parseHtml(await fetchHtml(href));
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
			logListing(listing);
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
