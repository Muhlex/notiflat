import sanitizeHtml from "sanitize-html";
import { parse } from "node-html-parser";
import { fetchHtmlRetry, schedule } from "./shared";
import { logListing, sendListing } from "./notify";

function parseHtml(string?: string): Listing[] {
	if (!string) return [];

	const sanitizedStr = sanitizeHtml(string, { allowedAttributes: false });
	const html = parse(sanitizedStr);
	const items = html.querySelectorAll("#srchrslt-adtable .aditem");
	return items.filter(item => item.getAttribute("data-adid")).map((item): Listing => {
		const tags = item.querySelectorAll(".simpletag.tag-small").map(tag => tag.textContent);
		return {
			id: item.getAttribute("data-adid") as string,
			title: item.querySelector(".ellipsis")?.textContent.trim(),
			desc: item.querySelector(".aditem-main--middle--description")?.textContent.replaceAll("\n", " ").trim(),
			location: item.querySelector(".aditem-main--top--left")?.textContent.replace(/\s+/g, " ").trim(),
			price: Number(item.querySelector(".aditem-main--middle--price-shipping--price")?.textContent.replace(/[^0-9]+/g, "")),
			img: item.querySelector(".imagebox")?.getAttribute("data-imgsrc")?.replace("rule=$_2.JPG", "rule=$_20.JPG"),
			size: tags[0] ? parseInt(tags[0]) : undefined,
			rooms: tags[1] ? parseInt(tags[1]) : undefined,
			url: item.getAttribute("data-href") && ("https://ebay-kleinanzeigen.de" + item.getAttribute("data-href")),
			platform: "ebay"
		};
	});
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
			logListing(listing);
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
