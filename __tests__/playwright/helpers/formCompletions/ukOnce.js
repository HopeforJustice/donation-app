/* 
One off UK
Handles filling in details for
    Card payments
	PayPal 
*/

import { handlePayPalCheckout } from "../paypalCheckout";

export default async function fillUkOnce(page, testDetails) {
	let stripeFrame;
	const params = new URLSearchParams();
	params.set("test", "true");

	if (testDetails.campaign) params.set("campaign", testDetails.campaign);
	if (testDetails.fund) params.set("fund", testDetails.fund);
	if (testDetails.utmSource) params.set("utm_source", testDetails.utmSource);
	if (testDetails.utmMedium) params.set("utm_medium", testDetails.utmMedium);
	if (testDetails.utmCampaign)
		params.set("utm_campaign", testDetails.utmCampaign);
	if (testDetails.projectId) params.set("projectId", testDetails.projectId);
	if (testDetails.organisationName)
		params.set("organisationName", testDetails.organisationName);
	if (testDetails.givingTo) params.set("givingTo", testDetails.givingTo);
	if (testDetails.donorType) params.set("donorType", testDetails.donorType);

	await page.goto(`/?${params.toString()}`);
	await page.getByPlaceholder("0.00").click();
	await page.getByPlaceholder("0.00").fill(testDetails.amount.toString());
	await page.getByLabel("Title").selectOption(testDetails.title);
	await page.getByLabel("First name").click();
	await page.getByLabel("First name").fill(testDetails.firstName);
	await page.getByLabel("Last name").click();
	await page.getByLabel("Last name").fill(testDetails.lastName);
	await page.getByLabel("Email").click();
	await page.getByLabel("Email").fill(testDetails.email);
	await page.getByLabel("Frequency").selectOption("once");
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
	await page.getByLabel("Postcode").click();
	await page.getByLabel("Postcode").fill(testDetails.postalCode);
	await page.getByLabel("Country").selectOption(testDetails.country);
	await page.getByRole("button", { name: "Next Step" }).click();
	await page
		.getByLabel("Do you want to Gift Aid your")
		.selectOption(testDetails.giftAid ? "true" : "false");
	await page.getByRole("button", { name: "Next Step" }).click();

	//preference toggles, on by default
	if (!testDetails.preferences.email) {
		await page.locator('label[for="emailPreference"]').click();
	}
	if (!testDetails.preferences.post) {
		await page.locator('label[for="postPreference"]').click();
	}
	if (!testDetails.preferences.sms) {
		await page.locator('label[for="smsPreference"]').click();
	}
	if (!testDetails.preferences.phone) {
		await page.locator('label[for="phonePreference"]').click();
	}

	await page.getByRole("button", { name: "Next Step" }).click();
	if (testDetails.gateway === "paypal") {
		await page.waitForTimeout(500); // Wait for any potential loading
		await page.getByTestId("paypal-payment-step").click();
		// Handle PayPal checkout popup
		await handlePayPalCheckout(page, testDetails);
	} else if (testDetails.stripe.pathway === "bank app") {
		//bank app payment pathway
		await page
			.getByTestId("stripe-payment-step")
			.locator("iframe")
			.contentFrame()
			.getByRole("button", { name: "Pay By Bank App" })
			.click();
		await page
			.getByTestId("stripe-payment-step")
			.locator("iframe")
			.contentFrame()
			.getByTestId("featured-institution-uk_monzo")
			.locator("div")
			.first()
			.click();
		await page.getByTestId("donate-button").click();
		const outerFrame = page.frameLocator('iframe[src*="lightbox-inner"]');
		const nestedFrame = outerFrame.frameLocator(
			'iframe[title="In-context payment completion page"]'
		);

		await nestedFrame.getByRole("link", { name: "Continue on Web" }).click();
		await page.getByTestId("authorize-test-payment-button").click();
	} else {
		stripeFrame = page.frameLocator(
			'iframe[allow="payment *; clipboard-write"]'
		);
		await page.getByTestId("stripe-payment-step").locator("iframe").click();
		await stripeFrame.getByLabel("Open Stripe Developer Tools").click();
		if (testDetails.stripe.pathway === "successful card") {
			await stripeFrame
				.getByRole("button", { name: "Successful card ••••" })
				.click();
		}
		await page.locator("body").click({ position: { x: 0, y: 0 } });
		await page.getByTestId("donate-button").click();
	}
}
