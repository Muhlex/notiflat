type Price = { base?: number, total?: number, deposit?: number }

type Terms = { start?: Date, end?: Date }

type Platform = "ebay" | "wg-gesucht";

type Listing = {
	id: string
	title?: string
	desc?: string
	location?: string
	price?: Price
	img?: string
	size?: number
	rooms?: number
	terms?: Terms
	url?: string
	platform: Platform
}
