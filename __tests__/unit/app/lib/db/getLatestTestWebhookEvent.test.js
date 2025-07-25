import getWebhookEvent from "@/app/lib/db/getLatestTestWebhookEvent";

describe("Get the latest test webhook event event from the database", () => {
	it("Should look for the latest processed_event with test=true", async () => {
		const result = await getWebhookEvent();
		console.log("Result:", result);
		expect(result).toEqual(expect.any(Object));
	});
});
