import getList from "@/app/lib/mailchimp/getList";

describe("Mailchimp Get List by Id", () => {
	it("should make a real API call to Mailchimp and return the UK Audience List", async () => {
		const result = await getList();
		expect(result).toEqual(expect.any(Object));
	});
});
