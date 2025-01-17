import mailchimpPing from "@/app/lib/mailchimp/ping";

describe("Mailchimp Ping Test", () => {
	it("should make a real API call to Mailchimp and return the result", async () => {
		const result = await mailchimpPing();
		expect(result).toMatchObject({
			health_status: expect.any(String),
		});
	});
});
