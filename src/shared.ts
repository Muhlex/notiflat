import fetch, { HeadersInit } from "node-fetch";

export const platformLabels: { [platform in Platform]: string } = {
	"ebay": "ebay Kleinanzeigen",
	"wg-gesucht": "WG-Gesucht.de",
};

export const defaultHeaders: HeadersInit = {
	"Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
	"Accept-Language": "en,en-US;q=0.7,de;q=0.3",
	"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:105.0) Gecko/20100101 Firefox/105.0"
};

export function sleep(ms: number) {
	return new Promise<void>(resolve => setTimeout(() => resolve(), ms));
}

export async function fetchHtmlRetry(
	url: string, headers?: HeadersInit, { retries, delay } = { retries: 3, delay: 400 }
): Promise<string | undefined> {
	const result = await fetchHtml(url, headers);
	if (typeof result === "undefined" && retries > 0) {
		await sleep(250);
		console.log("🔁 Retrying...");
		return fetchHtmlRetry(url, headers, { retries: retries - 1, delay });
	}
	return result;
}

export async function fetchHtml(url: string, headers: HeadersInit = defaultHeaders) {
	let res = undefined;

	try {
		res = await fetch(url, { headers });
		if (!res.ok) throw Error(`HTTP Error: ${res.status} ${res.statusText}`);
	} catch (error) {
		console.error(`🛑 Error fetching ${url}.`);
		return;
	}

	try {
		return await res.text();
	} catch (error) {
		console.error(`🛑 Error transforming fetched data to text (${url}):`);
		console.error(error);
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
