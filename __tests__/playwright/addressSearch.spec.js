import { test, expect } from "@playwright/test";

test.describe("Test the Loqate address finder", () => {
	test("Confirm loqate is working and allows the user to auto fill an address in the UK", async ({
		page,
	}) => {
		await page.goto(
			"https://donation-app-git-preview-hope-for-justice.vercel.app/"
		);
		await page.getByPlaceholder("0.00").click();
		await page.getByPlaceholder("0.00").fill("10.00");
		await page.getByLabel("Title").selectOption("Mr");
		await page.getByLabel("First name").click();
		await page.getByLabel("First name").fill("test");
		await page.getByLabel("Last name").click();
		await page.getByLabel("Last name").fill("test");
		await page.getByLabel("Email").click();
		await page.getByLabel("Email").fill("test@test.com");
		await page.getByLabel("Phone number").click();
		await page.getByLabel("Phone number").fill("01234567890");
		await page.getByLabel("On what date each month would").selectOption("15");
		await page.getByRole("button", { name: "Next Step" }).click();
		await page.getByPlaceholder("Type your address to search").click();
		await page
			.getByPlaceholder("Type your address to search")
			.fill("10 stonegate crescen");
		await expect(page.locator("ul")).toContainText(
			"10 Stonegate Crescent Meanwood Leeds LS7 2TD"
		);
		await page.getByText("10 Stonegate Crescent").click();
		await expect(page.getByLabel("Address Line 1")).toHaveValue(
			"10 Stonegate Crescent"
		);
		await expect(page.getByLabel("Address Line 2")).toHaveValue("Meanwood");
		await expect(page.getByLabel("Town/City")).toHaveValue("Leeds");
		await expect(page.getByLabel("Postcode")).toHaveValue("LS7 2TD");
		await expect(page.getByLabel("Country")).toHaveValue("United Kingdom");
		await page.getByRole("button", { name: "Next Step" }).click();
	});
});
