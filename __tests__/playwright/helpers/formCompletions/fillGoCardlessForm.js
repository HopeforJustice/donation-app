/* 
Fills GoCardless hosted page with test data
- Could be expanded for giving as a business
*/

export default async function fillGoCardlessForm(page, testDetails) {
	await page.getByRole("button", { name: "Continue" }).click();
	await page.getByTestId("branch_code").click();
	await page.getByTestId("branch_code").fill(testDetails.goCardless.branchCode);
	await page.getByTestId("account_number").click();
	await page
		.getByTestId("account_number")
		.fill(testDetails.goCardless.accountNumber);
	await page.getByRole("button", { name: "Continue" }).click();
	await page
		.getByTestId("billing-request.bank-confirm.direct-debit-cta-button")
		.click();
}
