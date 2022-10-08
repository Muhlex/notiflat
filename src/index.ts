import { exit } from "process";
import { init as initEbay } from "./ebay";
import { init as initWgGesucht } from "./wg-gesucht";

import { sources } from "./config.json";
import { platformLabels } from "./shared";

(async () => {
	const initFuncs: { [platform in Platform]: (href: string) => void } = {
		"ebay": initEbay,
		"wg-gesucht": initWgGesucht,
	};

	let urlCount = 0;
	for (const platformStr in sources) {
		const platform = platformStr as Platform;
		const { urls } = sources[platform];
		const func = initFuncs[platform];
		for (const url of urls) {
			func(url);
			urlCount++;
			console.log(`Initializing ${platformLabels[platform]} search: ${url}`);
		}
	}

	if (urlCount === 0) {
		console.warn("No sources specified in config. Exiting.");
		exit(1);
	}

	const platformCount = Object.keys(sources).length;
	console.log(`\
Listening for updates on ${urlCount} search quer${urlCount === 1 ? "y" : "ies"} \
across ${platformCount} platform${platformCount === 1 ? "" : "s"}.`);
	setInterval(() => { /* keep alive forever */ }, 6000);
})();
