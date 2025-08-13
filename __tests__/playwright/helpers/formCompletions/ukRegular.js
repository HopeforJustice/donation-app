/* 
For progressing the UK regular form up to GoCardless hosted page
*/

export default async function fillUkRegular(page, testDetails) {
	await page.goto(
		`http://localhost:3000/${
			testDetails.campaign ? `campaign=${testDetails.campaign}` : ""
		}`
	);
	await page.getByPlaceholder("0.00").click();
	await page.getByPlaceholder("0.00").fill(testDetails.amount.toString());
	await page.getByLabel("Title").selectOption(testDetails.title);
	await page.getByLabel("First name").click();
	await page.getByLabel("First name").fill(testDetails.firstName);
	await page.getByLabel("Last name").click();
	await page.getByLabel("Last name").fill(testDetails.lastName);
	await page.getByLabel("Email").click();
	await page.getByLabel("Email").fill(testDetails.email);
	await page.getByLabel("Phone number").click();
	await page.getByLabel("Phone number").fill(testDetails.phoneNumber);
	await page
		.getByLabel("On what date each month would")
		.selectOption(testDetails.directDebitDay.toString());
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
	// await page.getByLabel("County").click();
	// await page.getByLabel("County").fill(testDetails.county);
	await page.getByLabel("Country").selectOption(testDetails.country);
	await page.getByRole("button", { name: "Next Step" }).click();
	await page
		.getByLabel("Do you want to Gift Aid your")
		.selectOption(testDetails.giftAid ? "true" : "false");
	await page.getByRole("button", { name: "Next Step" }).click();
	await page
		.getByLabel("Email")
		.selectOption(testDetails.preferences.email ? "true" : "false");
	await page
		.getByLabel("Post")
		.selectOption(testDetails.preferences.post ? "true" : "false");
	await page
		.getByLabel("SMS")
		.selectOption(testDetails.preferences.sms ? "true" : "false");
	await page
		.getByLabel("Phone")
		.selectOption(testDetails.preferences.phone ? "true" : "false");
	await page.getByTestId("donate-button").click();
}
