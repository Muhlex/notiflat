type ListingType = "ebay" | "wg-gesucht";

type Listing = {
	id: string
	title: string
	desc: string
	price: number
	img: string,
	tags: string[]
	href: string
	type: ListingType
}
