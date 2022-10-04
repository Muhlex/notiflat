import fetch from "node-fetch";

export const siteLabels: { [type in ListingType]: string } = {
	"ebay": "ebay Kleinanzeigen",
	"wg-gesucht": "WG-Gesucht.de",
};

export const defaultHeaders = {
	"Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
	"Accept-Language": "en,en-US;q=0.7,de;q=0.3",
	"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:105.0) Gecko/20100101 Firefox/105.0"
};

export async function fetchHtml(url: string, headers = defaultHeaders) {
	try {
		const res = await fetch(url, { headers });
		return await res.text();
	} catch (error) {
		console.error(`🛑 Error fetching search results (${url}):`);
		console.error(error);
		return undefined;
	}
}

export function randomRange(min: number, max: number) {
	return Math.random() * (max - min) + min;
}

export function schedule(func: () => void, delay: number | { min: number, max: number }) {
	func();
	setTimeout(() => {
		schedule(func, delay);
	}, typeof delay === "number" ? delay : randomRange(delay.min, delay.max));
}
