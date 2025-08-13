/*
 * End to End Test: Setting up a Direct Debit
 * Integrations tested
 * - GoCardless
 * - Donorfy
 * - Mailchimp
 * - Sparkpost (manual confirmation needed)
 */

import { test, expect } from "@playwright/test";
import fillUkOnce from "./helpers/formCompletions/ukOnce";
import deleteSubscriber from "@/app/lib/mailchimp/deleteSubscriber";
import DonorfyClient from "@/app/lib/donorfy/donorfyClient";
import pollForConstituent from "./helpers/pollForConstituent";

const donorfyUK = new DonorfyClient(
	process.env.DONORFY_UK_KEY,
	process.env.DONORFY_UK_TENANT
);

// Default campaign: Donation App General Campaign

const deleteAfterTest = true;
const testDetails = {
	fund: null,
	frequency: "once",
	amount: 10.25,
	title: "Mr",
	firstName: "James",
	lastName: "Holt",
	phoneNumber: "07777777777",
	directDebitDay: 15,
	address1: "10 Test Place",
	address2: "Test Area",
	townCity: "Test City",
	postalCode: "LS7 2TD",
	country: "United Kingdom",
	giftAid: true,
	preferences: {
		//change email to test mailchimp
		email: false,
		post: true,
		sms: true,
		phone: true,
	},
	inspiration: "Inspiration_Faith",
	inspirationNotes: "Test notes",
	campaign: null,
	defaultCampaign: "Donation App General Campaign",
	utmSource: "test_source",
	utmMedium: "test_medium",
	utmCampaign: "test_campaign",
};

//store constituents for deletion
const constituents = [];

//store emails for deletion
const emails = [];

test.describe("E2E: Test one off giving via Stripe", () => {
	test("Should test a successful card", async ({ page }) => {
		/*
		Fill in the form(s)
		*/
		const timestamp = Date.now();
		const testEmail = `james.holt+testScard${timestamp}@hopeforjustice.org`;
		emails.push(testEmail);
		await test.step("Fill the donation form with test details", async () => {
			await fillUkOnce(page, {
				stripe: { pathway: "successful card" },
				email: testEmail,
				...testDetails,
			});
		});
		await page.waitForTimeout(10000); // wait for the payment to process
		// need to setup success page/webhooks to perform stripe -> donorfy actions
		// need to store completed actions in database
		// need to test the actions completed here
		await expect(page.getByRole("heading", { name: /Thank You/i })).toBeVisible(
			{ timeout: 10000 }
		);
	});

	//delete after test
	test.afterAll(async () => {
		if (deleteAfterTest) {
			// Delete the test email from Mailchimp

			// will need to wait for the webhook for this to be reliable
			if (testDetails.preferences.email) {
				for (const email of emails) {
					try {
						await deleteSubscriber(email, "uk");
						console.log("Deleted Mailchimp Subscriber");
					} catch (err) {
						console.warn(`Failed to delete Mailchimp subscriber: ${err}`);
					}
				}
			} else {
				console.log("Skipping Mailchimp deletion as email preference is false");
			}
			// Delete the test constituents from Donorfy
			for (const email of emails) {
				try {
					const constituentId = await pollForConstituent(email, "uk");
					console.log("pollForConstituent", constituentId);
					await donorfyUK.deleteConstituent(constituentId);
					console.log(`Deleted Donorfy constituent: ${constituentId}`);
				} catch (err) {
					console.warn(`Failed to delete Donorfy constituent: ${err}`);
				}
			}
		}
	});
});
