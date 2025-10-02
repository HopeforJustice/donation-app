/* 
Regular subscription US
Handles filling in details for US monthly subscriptions via Stripe
*/

export default async function fillUSRegular(page, testDetails) {
	let stripeFrame;

	// Build URL parameters
	const params = new URLSearchParams();
	params.set("test", "true");

	if (testDetails.campaign) params.set("campaign", testDetails.campaign);
	if (testDetails.fund) params.set("fund", testDetails.fund);
	if (testDetails.utmSource) params.set("utm_source", testDetails.utmSource);
	if (testDetails.utmMedium) params.set("utm_medium", testDetails.utmMedium);
	if (testDetails.utmCampaign)
		params.set("utm_campaign", testDetails.utmCampaign);

	await page.goto(`/?${params.toString()}`);

	await page.getByLabel("Frequency").selectOption("monthly");
	await page.locator('select[name="currency"]').selectOption("usd");
	await page.getByPlaceholder("0.00").click();
	await page.getByPlaceholder("0.00").fill(testDetails.amount.toString());
	await page.getByLabel("First name").click();
	await page.getByLabel("First name").fill(testDetails.firstName);
	await page.getByLabel("Last name").click();
	await page.getByLabel("Last name").fill(testDetails.lastName);
	await page.getByLabel("Email").click();
	await page.getByLabel("Email").fill(testDetails.email);
	await page.getByLabel("Phone number").click();
	await page.getByLabel("Phone number").fill(testDetails.phoneNumber);
	await page
		.getByLabel("What inspired you to give?")
		.selectOption(testDetails.inspiration);
	await page.getByLabel("Please tell us more").click();
	await page
		.getByLabel("Please tell us more")
		.fill(testDetails.inspirationNotes);
	await page.getByRole("button", { name: "Next Step" }).click();
	await page.getByLabel("Address Line 1").click();
	await page.getByLabel("Address Line 1").fill(testDetails.address1);
	await page.getByLabel("Address Line 2").click();
	await page.getByLabel("Address Line 2").fill(testDetails.address2);
	await page.getByLabel("Town/City").click();
	await page.getByLabel("Town/City").fill(testDetails.townCity);
	await page.getByLabel("Zip Code").click();
	await page.getByLabel("Zip Code").fill(testDetails.postalCode);
	await page.getByLabel("Country").selectOption(testDetails.country);
	await page.getByLabel("State").selectOption(testDetails.state);
	await page.getByRole("button", { name: "Next Step" }).click();
	stripeFrame = page.frameLocator('iframe[allow="payment *; clipboard-write"]');
	await page.getByTestId("stripe-payment-step").locator("iframe").click();
	await stripeFrame.getByLabel("Open Stripe Developer Tools").click();
	if (testDetails.stripe.pathway === "successful card") {
		await stripeFrame
			.getByRole("button", { name: "Successful card ••••" })
			.click();
	}
	await stripeFrame.getByLabel("Close Stripe Developer Tools").click();
	await page.locator("body").click({ position: { x: 0, y: 0 } });
	await page.getByTestId("donate-button").click();
}
