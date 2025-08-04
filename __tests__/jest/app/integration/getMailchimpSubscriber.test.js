import getSubscriber from "@/app/lib/mailchimp/getSubscriber";

describe("Integration Test: Get subscriber", () => {
	const testEmail = "james.holt+test1754065124985@hopeforjustice.org";
	it("Should get a subscriber", async () => {
		const subscriber = await getSubscriber(testEmail, "uk");
		console.log(subscriber);
	});
});
