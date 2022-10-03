import TelegramBot from "node-telegram-bot-api";

// https://t.me/NotiflatBot
const token = "";
const chatIDs = [];

export function logListing(listing: Listing) {
	const timestampStr = new Date().toISOString().replace("T", " ").replace(/\..+/, "");
	console.log(`<${timestampStr}> ##### NEW [${listing.type}] #####`);
	console.log(listing.title, "(💶 " + listing.price + " €)");
	console.log("📝", listing.desc);
	console.log("🔗", listing.href);
}

const bot = new TelegramBot(token);

export function sendListing(listing: Listing) {
	const labels: { [type in ListingType]: string } = {
		"ebay": "ebay Kleinanzeigen",
		"wg-gesucht": "WG-Gesucht.de",
	};

	chatIDs.forEach(id => {
		const text = `
*${listing.title}*
💶 ${listing.price} €
📝 ${listing.desc}
🏷️ ${listing.tags.join(" | ") || "–"}
		`.trim();
		bot.sendPhoto(id, listing.img, {
			caption: text,
			parse_mode: "Markdown",
			reply_markup: {
				inline_keyboard: [[
					{ text: "🔗 View on " + labels[listing.type], url: listing.href }
				]]
			}
		});
	});
}
