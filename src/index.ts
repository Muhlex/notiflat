import { argv, exit } from "process";
import { init as initEbay } from "./ebay";
import { init as initWgGesucht } from "./wg-gesucht";
import { siteLabels } from "./shared";
// import { sendListing } from "./notify";

(async () => {
	const [, , type, href] = argv;
	switch (type) {
		case "ebay":
			initEbay(href);
			break;

		case "wg-gesucht":
			initWgGesucht(href);
			break;

		default:
			console.warn("No type specified as first argument. Exiting.");
			exit(1);
	}
	console.log(`Scheduling ${siteLabels[type]} search result evaluation for:\n` + href);

	// sendListing({
	// 	id: "1234",
	// 	title: "Schöne Maisonette-Wohnung - Nahe U-Bahn \"Obersendling\" bzw. S-Bahn \"Siemenswerke\" zu vermieten",
	// 	desc: "Objektbeschreibung * Schöne Maisonette-Wohnung * Ideal für 3 Personen * OG: Schlafzimmer mit...",
	// 	location: "80995 Feldmoching (8 km)",
	// 	price: 1337,
	// 	img: "https://images.unsplash.com/photo-1664820965487-2c81f58083c5",
	// 	size: 52,
	// 	rooms: 2,
	// 	url: "https://google.com",
	// 	type: "ebay"
	// });

	setInterval(() => { /* keep alive forever */ }, 6000);
})();
