import TelegramBot, { SendMessageOptions } from "node-telegram-bot-api";
import { platformLabels } from "./shared";

import { telegram } from "./config.json";

function getLocalTimestamp() {
	const now = new Date(); // Or the date you'd like converted.
	return new Date(now.getTime() - (now.getTimezoneOffset() * 60000))
		.toISOString()
		.replace("T", " ")
		.replace(/\..+/, "");
}

function logListing(listing: Listing) {
	console.log(`\n[${getLocalTimestamp()}] -----New Listing-----`);
	console.log(listing);
}

const bot = new TelegramBot(telegram.token);

export function sendListing(listing: Listing) {
	const esc = (string: string | undefined) => {
		if (!string) return undefined;
		return string.replace(/[_*[\]()~`>#+-=|{}.!]/g, "\\$&");
	};

	const eur = (amount?: number) => {
		return amount
			? amount.toLocaleString("en-US").replaceAll(",", "\u200a") + "\u2009€"
			: "—";
	};

	const terms = (terms?: Terms) => {
		const date = (date: Date) => {
			const d = String(date.getDate()).padStart(2, "0");
			const m = String(date.getMonth() + 1).padStart(2, "0");
			const y = date.getFullYear();
			return [d, m, y].join(".");
		};

		if (terms?.start && terms.end) return `${date(terms.start)} - ${date(terms.end)}`;
		else if (terms?.start) return `from ${date(terms.start)}`;
		else if (terms?.end) return `until ${date(terms.end)}`;
		return undefined;
	};

	const l = listing;
	logListing(l);

	telegram.chatIDs.forEach(id => {
		const text = `\
📍 _${esc(l.location) || "~Unknown location~"}_
*${esc(l.title) || "~No title~"}*
${(l.price?.base || l.price?.total)
		? `🥶 ${eur(l.price.base)} \\| 🥵 ${eur(l.price.total)}`
		: "~Unknown price~"}

📝 ${esc(l.desc && l.desc.length > 200 && l.desc.substring(0, 200) + "..." || l.desc) || "~No description~"}
📐 ${l.size ? l.size + "\u2009m²" : "~Unknown size~"}
📦 ${l.rooms ? l.rooms + "\u2009rooms" : "~Room count unknown~"}
📅 ${esc(terms(l.terms)) || "~Unknown date~"}`;

		const options: SendMessageOptions = {
			parse_mode: "MarkdownV2",
			reply_markup: {
				inline_keyboard: [[
					{ text: "🔗\u2000View on " + platformLabels[l.platform], url: l.url }
				]]
			}
		};

		if (l.img) {
			bot.sendPhoto(id, l.img, { caption: text, ...options });
		} else {
			bot.sendMessage(id, text, options);
		}
	});
}
