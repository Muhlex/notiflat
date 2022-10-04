type ListingType = "ebay" | "wg-gesucht";

type Listing = {
	id: string
	title: string | undefined
	desc: string | undefined
	location: string | undefined
	price: number | undefined
	img: string | undefined,
	size: number | undefined
	rooms: number | undefined
	url: string | undefined
	type: ListingType
}
