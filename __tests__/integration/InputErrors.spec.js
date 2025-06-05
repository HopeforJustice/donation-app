import { test, expect } from "@playwright/test";

test.describe("Test the multistep form validation", () => {
	test("test", async ({ page }) => {
		await page.goto("http://localhost:3000/");
		await page.getByRole("button", { name: "Next Step" }).click();
		await expect(page.locator("#amount-error")).toContainText(
			"Please enter a donation amount"
		);
		await expect(page.locator("#firstName-error")).toContainText(
			"Please enter your first name"
		);
		await expect(page.locator("#lastName-error")).toContainText(
			"Please enter your last name"
		);
		await expect(page.locator("#email-error")).toContainText(
			"Please enter a valid email"
		);
		await expect(page.locator("#phone-error")).toContainText(
			"Please enter a valid phone number"
		);
		await expect(page.locator("#directDebitStartDate-error")).toContainText(
			"Please select a date"
		);
		await page.getByPlaceholder("0.00").click();
		await page.getByPlaceholder("0.00").fill("40");
		await page.getByLabel("Title").selectOption("Sir");
		await page.getByLabel("First name").click();
		await page.getByLabel("First name").fill("Harry");
		await page.getByLabel("Last name").click();
		await page.getByLabel("Last name").fill("Potter");
		await page.getByLabel("Email").click();
		await page.getByLabel("Email").fill("hp.com");
		await page.getByLabel("Phone number").click();
		await page.getByText("Please enter a valid email").click({
			button: "right",
		});
		await expect(page.locator("#email-error")).toContainText(
			"Please enter a valid email"
		);
		await page.getByLabel("Email").click();
		await page.getByLabel("Email").press("ArrowLeft");
		await page.getByLabel("Email").press("ArrowLeft");
		await page.getByLabel("Email").press("ArrowLeft");
		await page.getByLabel("Email").press("ArrowLeft");
		await page.getByLabel("Email").fill("hp@hogwarts.com");
		await page.getByLabel("Phone number").click();
		await page.getByLabel("Phone number").fill("123");
		await page.getByText("Please enter a valid phone").click();
		await expect(page.locator("#phone-error")).toContainText(
			"Please enter a valid phone number"
		);
		await page.getByLabel("Phone number").click();
		await page.getByLabel("Phone number").fill("123456");
		await page.getByLabel("On what date each month would").selectOption("1");
		await page.locator(".rounded-lg").click();
		await page.getByRole("button", { name: "Next Step" }).click();
		await page.getByRole("button", { name: "Next Step" }).click();
		await expect(page.locator("#address1-error")).toContainText(
			"Please enter your address"
		);
		await expect(page.locator("#townCity-error")).toContainText(
			"Please enter your Town/City"
		);
		await expect(page.locator("#postcode-error")).toContainText(
			"Invalid format"
		);
		await expect(page.locator("#country-error")).toContainText(
			"Please select your country"
		);
		await page.getByLabel("Address Line 1").click();
		await page.getByLabel("Address Line 1").fill("4 Private Drive");
		await page.getByLabel("Town/City").click();
		await page.getByLabel("Town/City").fill("London");
		await page.getByLabel("Postcode").click();
		await page.getByLabel("Postcode").fill("LS72TD");
		await page.getByLabel("County").click();
		await page.getByLabel("County").fill("London");
		await page.getByLabel("Country").selectOption("United Kingdom");
		await page.locator(".rounded-lg").click();
		await page.getByLabel("Address Line 2").click();
		await page.getByLabel("Address Line 2").fill("22");
		await page.getByRole("button", { name: "Next Step" }).click();
		await page.getByRole("button", { name: "Next Step" }).click();
		await expect(page.locator("#giftAid-error")).toContainText(
			"This field is required"
		);
		await page.getByRole("button", { name: "Next Step" }).click();
		await page.getByLabel("Do you want to Gift Aid your").selectOption("true");
		await page.getByRole("button", { name: "Next Step" }).click();

		await page.getByLabel("SMS").selectOption("true");
		await expect(page.getByLabel("SMS")).toHaveValue("true");
		await page.getByRole("button", { name: "Submit" }).click();
		await expect(page.locator("#emailPreference-error")).toContainText(
			"This field is required"
		);
		await page.getByLabel("Email").selectOption("true");
		await expect(page.getByLabel("Email")).toHaveValue("true");
		await page.getByLabel("Email").selectOption("false");
		await expect(page.getByLabel("Email")).toHaveValue("false");

		await page.getByLabel("SMS").selectOption("false");
		await expect(page.getByLabel("SMS")).toHaveValue("false");
		await page.getByLabel("Post").selectOption("true");
		await expect(page.getByLabel("Post")).toHaveValue("true");
		await page.getByLabel("Post").selectOption("false");
		await expect(page.getByLabel("Post")).toHaveValue("false");
		await page.getByLabel("Phone").selectOption("true");
		await expect(page.getByLabel("Phone")).toHaveValue("true");
		await page.getByLabel("Phone").selectOption("false");
		await expect(page.getByLabel("Phone")).toHaveValue("false");
		await page
			.getByLabel("What inspired you to give?")
			.selectOption("Inspiration_Event");
		await expect(page.getByLabel("What inspired you to give?")).toHaveValue(
			"Inspiration_Event"
		);
		await page.getByLabel("Please tell us more").click();
		await page.getByLabel("Please tell us more").fill("testing");
		await expect(page.getByLabel("Please tell us more")).toHaveValue("testing");
		await expect(page.locator("form")).toContainText(
			"Donation Total: £40.00 GBP"
		);
		await expect(page.locator("form")).toContainText("monthly");
		await expect(page.locator("form")).toContainText("Gift Aid: Yes");
		await page.getByRole("button", { name: "Submit" }).click();
		await expect(page.locator('[id="__next"]')).toContainText(
			"Set up a Direct Debit with Hope for Justice test"
		);
	});
});
