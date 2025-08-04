import getAllLists from "@/app/lib/mailchimp/getAllLists";

describe("Mailchimp List Test", () => {
	it("should make a real API call to Mailchimp and return all lists", async () => {
		const result = await getAllLists();
		expect(result).toEqual(expect.any(Object));
	});
});
