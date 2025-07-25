/*
 * End to End Test: Setting up a Direct Debit
 * Integrations tested
 * - GoCardless
 * - Donorfy
 * - Mailchimp
 * - Sparkpost
 *
 */

import { test, expect } from "@playwright/test";

// generate test email
const timestamp = Date.now();
const testEmail = `james.holt+test${timestamp}@hopeforjustice.org`;

test.describe("E2E: Setup Direct Debit", () => {
	test("test", async ({ page }) => {
		await page.goto("http://localhost:3000/");
		await page.getByPlaceholder("0.00").click();
		await page.getByPlaceholder("0.00").fill("10");
		await page.getByLabel("Title").selectOption("Mr");
		await page.getByLabel("First name").click();
		await page.getByLabel("First name").fill("James");
		await page.getByLabel("Last name").click();
		await page.getByLabel("Last name").fill("Holt");
		await page.getByLabel("Email").click();
		await page.getByLabel("Email").fill(testEmail);
		await page.getByLabel("Phone number").click();
		await page.getByLabel("Phone number").fill("07949792166");
		await page.getByLabel("On what date each month would").selectOption("15");
		await page.getByRole("button", { name: "Next Step" }).click();
		await page.getByLabel("Address Line 1").click();
		await page.getByLabel("Address Line 1").fill("10 Stonegate crescent");
		await page.getByLabel("Town/City").click();
		await page.getByLabel("Town/City").fill("Leeds");
		await page.getByLabel("Postcode").click();
		await page.getByLabel("Postcode").fill("LS72TD");
		await page.getByLabel("County").click();
		await page.getByLabel("County").fill("Yorkshire");
		await page.getByLabel("Country").selectOption("United Kingdom");
		await page.getByRole("button", { name: "Next Step" }).click();
		await page.getByLabel("Do you want to Gift Aid your").selectOption("true");
		await page.getByRole("button", { name: "Next Step" }).click();
		await page.getByLabel("Email").selectOption("true");
		await page.getByLabel("Post").selectOption("true");
		await page.getByLabel("SMS").selectOption("true");
		await page.getByLabel("Phone").selectOption("true");
		await page
			.getByLabel("What inspired you to give?")
			.selectOption("Inspiration_Faith");
		await page.getByLabel("Please tell us more").click();
		await page.getByLabel("Please tell us more").fill("test");
		await page.getByRole("button", { name: "Submit" }).click();
		await page.getByRole("button", { name: "Continue" }).click();
		await page.getByTestId("branch_code").click();
		await page.getByTestId("branch_code").fill("20 - 00 - 00");
		await page.getByTestId("account_number").click();
		await page.getByTestId("account_number").fill("55779911");
		await page.getByRole("button", { name: "Continue" }).click();
		await page
			.getByTestId("billing-request.bank-confirm.direct-debit-cta-button")
			.click();
		await expect(page.getByRole("heading")).toContainText("Thank you James", {
			timeout: 20000,
		});
	});
});

// Poll database for (20s limit)
// need to make sure database gets updated with what we need
// get constituent id from the polled event
//... run tests/confirm all as we want
//    first make sure the email is the same as the test email
// remove constituent
// get the go cardless customer id from the polled event
//... run tests/confirm all is as we want
// remove go cardless customer
// Use Test email to confirm "delivery" event in Sparkpost
// Use test email to get a subscriber in mailchimp
// ... check tags
// ... since we said yes to email updates check the email is in that group
// remove subscriber from mailchimp
