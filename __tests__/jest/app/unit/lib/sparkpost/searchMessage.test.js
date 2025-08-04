import searchMessage from "@/app/lib/sparkpost/searchMessage";

/*
use params to search for a message in sparkpost
searchMessage({recipients: "james.holt+test1753791384357@hopeforjustice.org"})
*/

describe("Search for a message in sparkpost", () => {
	it("Should make a real API call to Sparkpost to find a message", async () => {
		const result = await searchMessage();
		console.log(result);
		expect(result).toEqual(expect.any(Object));
	});
});
