import fetch from "node-fetch";
import sanitizeHtml from "sanitize-html";
import { parse } from "node-html-parser";
import { randomRange } from "./utils";
import { logListing, sendListing } from "./notify";

async function fetchHtml(href: string) {
	try {
		const res = await fetch(href, {
			headers: {
				"Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
				"Accept-Language": "en,en-US;q=0.7,de;q=0.3",
				"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:105.0) Gecko/20100101 Firefox/105.0"
			}
		});
		return await res.text();
	} catch (error) {
		console.error(error);
		return undefined;
	}
}

function parseHtml(string?: string): Listing[] {
	if (!string) {
		console.error("Could not parse eBay search results.");
		return [];
	}

	const sanitizedStr = sanitizeHtml(string, {
		allowedAttributes: false
	});
	const html = parse(sanitizedStr);
	const items = html.getElementById("srchrslt-adtable").querySelectorAll(".aditem");
	return items.map(item => {
		return {
			id: item.getAttribute("data-adid") + "",
			title: item.querySelector(".ellipsis").textContent,
			desc: item.querySelector(".aditem-main--middle--description").textContent.replaceAll("\n", " "),
			price: Number(item.querySelector(".aditem-main--middle--price-shipping--price").textContent.replaceAll(/[^0-9]+/g, "")),
			img: String(item.querySelector(".imagebox").getAttribute("data-imgsrc")).replace("rule=$_2.JPG", "rule=$_20.JPG"),
			tags: item.querySelectorAll(".simpletag.tag-small").map(tag => tag.textContent),
			href: "https://ebay-kleinanzeigen.de" + item.getAttribute("data-href"),
			type: "ebay"
		};
	});
}

const cache = {
	knownIds: new Set<string>()
};

async function poll(href: string) {
	const listings = parseHtml(await fetchHtml(href));
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
		}
	}
}

export function schedule(href: string, minDelay: number, maxDelay: number) {
	poll(href);
	setTimeout(() => {
		schedule(href, minDelay, maxDelay);
	}, randomRange(minDelay, maxDelay));
}
