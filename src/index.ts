import { exit } from "process";
import { init as initEbay } from "./ebay";
import { init as initWgGesucht } from "./wg-gesucht";
import { siteLabels } from "./shared";

import { sources } from "./config.json";

(async () => {
	// TODO: Make this nicer...

	let sourcesCount = 0;
	if (sources["ebay"]) {
		initEbay(sources["ebay"]);
		sourcesCount++;
		console.log(`Scheduling ${siteLabels["ebay"]} search result evaluation for:\n` + sources["ebay"]);
	}
	if (sources["wg-gesucht"]) {
		initWgGesucht(sources["wg-gesucht"]);
		sourcesCount++;
		console.log(`Scheduling ${siteLabels["wg-gesucht"]} search result evaluation for:\n` + sources["wg-gesucht"]);
	}

	if (sourcesCount === 0) {
		console.warn("No sources specified in config. Exiting.");
		exit(1);
	}

	setInterval(() => { /* keep alive forever */ }, 6000);
})();
