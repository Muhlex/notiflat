import TelegramBot, { SendMessageOptions } from "node-telegram-bot-api";
import { siteLabels } from "./shared";

// https://t.me/NotiflatBot
const token = "";
const chatIDs = [];

function getLocalTimestamp() {
	const now = new Date(); // Or the date you'd like converted.
	return new Date(now.getTime() - (now.getTimezoneOffset() * 60000))
		.toISOString()
		.replace("T", " ")
		.replace(/\..+/, "");
}

export function logListing(listing: Listing) {
	console.log(`\n<${getLocalTimestamp()}> ##### NEW [${listing.type}] #####`);
	console.log(listing.title, "(💶 " + listing.price + " €)");
	console.log("📝", listing.desc);
	console.log("🔗", listing.url + "\n");
}

const bot = new TelegramBot(token);

export function sendListing(listing: Listing) {


	const esc = (string: string | undefined) => {
		if (!string) return undefined;
		return string.replace(/[_*[\]()~`>#+-=|{}.!]/g, "\\$&");
	};

	const l = listing;
	chatIDs.forEach(id => {
		const text = `
📍 _${esc(l.location) || "~Unknown location~"}_
*${esc(l.title) || "~No title~"}*
💶 ${l.price ? l.price.toLocaleString("en-US").replaceAll(",", "\u200a") + "\u2009€" : "~Unknown price~"}
📝 ${esc(l.desc) || "~No description~"}
📐 ${l.size ? l.size + "\u2009m²" : "~Unknown size~"}
📦 ${l.rooms ? l.rooms + "\u2009rooms" : "~Room count unknown~"}
		`.trim();

		const options: SendMessageOptions = {
			parse_mode: "MarkdownV2",
			reply_markup: {
				inline_keyboard: [[
					{ text: "🔗\u2000View on " + siteLabels[l.type], url: l.url }
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
