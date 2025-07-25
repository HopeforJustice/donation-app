import searchMessage from "@/app/lib/sparkpost/searchMessage";

/*
use params to search for a message in sparkpost
searchMessage({templates: "uk-regular-gift-confirmation"})
*/

describe("Search for a message in sparkpost", () => {
	it("Should make a real API call to Sparkpost to find a message", async () => {
		const result = await searchMessage();
		expect(result).toEqual(expect.any(Object));
	});
});
