import { argv, exit } from "process";
import { schedule as scheduleEbay } from "./ebay";

(async () => {
	const [, , type, href] = argv;
	switch (type.toLowerCase()) {
		case "ebay":
			scheduleEbay(href, 20 * 1000, 40 * 1000);
			console.log("Scheduling eBay search result evaluation for:\n" + href);
			break;

		case "wg-gesucht":
			console.log("Scheduling WG-Gesucht.de search result evaluation for:\n" + href);
			break;

		default:
			console.warn("No type specified as first argument. Exiting.");
			exit(1);
	}

	setInterval(() => { /* keep alive forever */ }, 6000);
})();
