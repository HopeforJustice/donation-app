/**
 * Helper function to handle PayPal checkout popup in Playwright tests
 */
export async function handlePayPalCheckout(page, testDetails) {
	// Set up popup listener before clicking the button
	const paypalPopupPromise = page.waitForEvent("popup");

	// Wait for PayPal iframe to load and find the PayPal button
	await page.waitForSelector('iframe[title="PayPal"]', { timeout: 10000 });
	const paypalFrame = page.frameLocator('iframe[title="PayPal"]').first();

	// Wait for the PayPal button to be available and click it
	await paypalFrame
		.locator('[data-funding-source="paypal"]')
		.waitFor({ timeout: 10000 });
	await paypalFrame.locator('[data-funding-source="paypal"]').click();

	// Get the popup page
	const paypalPopup = await paypalPopupPromise;

	// Wait for PayPal page to load completely
	await paypalPopup.waitForLoadState("networkidle");

	// Fill PayPal login form - handle different placeholder text in different environments
	const emailInput = paypalPopup
		.getByPlaceholder("Email address or mobile number")
		.or(paypalPopup.getByPlaceholder("Email or mobile number"))
		.or(paypalPopup.locator('input[type="email"]'))
		.first();
	await emailInput.fill(testDetails.paypal.email);
	await paypalPopup.getByRole("button", { name: "Next" }).click();

	// Wait for password field and fill it - handle potential placeholder variations
	await paypalPopup.waitForSelector('input[type="password"]', {
		timeout: 10000,
	});
	const passwordInput = paypalPopup
		.getByPlaceholder("Password")
		.or(paypalPopup.locator('input[type="password"]'))
		.first();
	await passwordInput.fill(testDetails.paypal.password);
	await paypalPopup.getByRole("button", { name: "Log In" }).click();

	// Complete the payment
	await paypalPopup.waitForSelector('[data-testid="submit-button-initial"]', {
		timeout: 30000,
	});
	await paypalPopup.getByTestId("submit-button-initial").click();

	// Wait for popup to close (indicating payment completion)
	await paypalPopup.waitForEvent("close", { timeout: 30000 });

	return paypalPopup;
}
