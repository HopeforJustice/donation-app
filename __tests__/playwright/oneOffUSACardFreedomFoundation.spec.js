/*
 * End to End Test: One off card payments via Stripe USA
 * Integrations tested
 * - Stripe
 * - Donorfy
 * - Mailchimp
 */

import { test, expect } from "@playwright/test";
import fillUSOnce from "./helpers/formCompletions/usOnce";
import getSubscriber from "@/app/lib/mailchimp/getSubscriber";
import deleteSubscriber from "@/app/lib/mailchimp/deleteSubscriber";
import pollForConstituent from "./helpers/pollForConstituent";
import pollForStripeWebhookEvent from "./helpers/pollForStripeWebhookEvent";
import { getDonorfyClient } from "@/app/lib/utils/apiUtils";

const donorfyUK = getDonorfyClient("uk");
const donorfyUS = getDonorfyClient("us");

// Default campaign: Donation App General Campaign

const deleteAfterTest = true;
const testDetails = {
	fund: null,
	frequency: "once",
	amount: 10.25,
	firstName: "James",
	lastName: "Holt",
	phoneNumber: "07777777777",
	directDebitDay: 15,
	address1: "10 Test Place",
	address2: "Test Area",
	townCity: "Test City",
	postalCode: "LS7 2TD",
	state: "Texas",
	country: "United States",
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
	campaign: "FreedomFoundation",
	defaultCampaign: "Donation App General Campaign",
	utmSource: "test_source",
	utmMedium: "test_medium",
	utmCampaign: "test_campaign",
	donorType: "individual",
	organisationName: "Test Organisation",
	givingTo: "Test Project",
	projectId: "FF25 USA Policy",
};

//store constituents for deletion
const constituents = [];

//store emails for deletion
const emails = [];

test.describe("E2E: Test one off giving via Stripe", () => {
	test("Should test a successful card", async ({ page }) => {
		const timestamp = Date.now();
		const testEmail = `james.holt+usonceff${timestamp}@hopeforjustice.org`;
		emails.push(testEmail);
		let constituentId;
		let webhookEvent;

		/*
		Fill in the form(s)
		*/
		await test.step("Fill the donation form with test details", async () => {
			await fillUSOnce(page, {
				stripe: { pathway: "successful card" },
				email: testEmail,
				...testDetails,
			});
		});

		await test.step("Verify successful payment completion", async () => {
			await expect(
				page.getByRole("heading", { name: /Thank You/i })
			).toBeVisible({ timeout: 10000 });
		});

		await test.step("Check URL parameters", async () => {
			const url = page.url();
			console.log("Success URL", url);
			const params = new URL(url).searchParams;
			expect(params.get("frequency")).toBe("once");
			expect(params.get("currency")).toBe("usd");
			expect(params.get("gateway")).toBe("stripe");
			expect(Number(params.get("amount"))).toBe(testDetails.amount);
		});

		/*
		Poll for webhook event processing
		*/
		await test.step("Poll for Stripe webhook event", async () => {
			webhookEvent = await pollForStripeWebhookEvent(
				testEmail,
				"usd", // Currency for US test
				"checkout.session.completed"
			);
			expect(webhookEvent).toBeTruthy();
			expect(webhookEvent.status).toBe("processed");
		});

		/*
		Get constituent ID and validate Donorfy integration
		*/
		await test.step("Get constituent ID from Donorfy", async () => {
			constituentId = await pollForConstituent(testEmail, "us");
			expect(constituentId).toBeTruthy();
		});

		/*
		Check Donorfy Details
		*/
		await test.step("Check Donorfy Details", async () => {
			await test.step("Get the Constituent and check details", async () => {
				const constituentData = await donorfyUS.getConstituent(constituentId);
				expect(constituentData.EmailAddress).toBe(testEmail);
				expect(constituentData).toEqual(
					expect.objectContaining({
						FirstName: testDetails.firstName,
						LastName: testDetails.lastName,
						AddressLine1: testDetails.address1,
						AddressLine2: testDetails.address2,
						Town: testDetails.townCity,
						PostalCode: testDetails.postalCode,
						Country: testDetails.country,
						Phone1: testDetails.phoneNumber,
						County: testDetails.state, // US uses state in County field
					})
				);
			});

			await test.step("Get the Constituent's preferences and check details", async () => {
				const getConstituentPreferencesResult =
					await donorfyUS.getConstituentPreferences(constituentId);
				const preferencesArray =
					getConstituentPreferencesResult.PreferencesList;

				// For US, all preferences should be true
				const channelPreferences = {};
				preferencesArray
					.filter((pref) => pref.PreferenceType === "Channel")
					.forEach((pref) => {
						const key =
							pref.PreferenceName === "Mail" ? "Post" : pref.PreferenceName;
						channelPreferences[key] = pref.PreferenceAllowed;
					});

				// US should default all to true
				expect(channelPreferences).toEqual(
					expect.objectContaining({
						Email: true,
						Post: true,
						SMS: true,
						Phone: true,
					})
				);

				//Check "Email Updates" Purpose - should be true for US
				const emailUpdatesPref = preferencesArray.find(
					(pref) =>
						pref.PreferenceType === "Purpose" &&
						pref.PreferenceName === "Email Updates"
				);

				expect(emailUpdatesPref?.PreferenceAllowed).toBe(true);
			});

			// Note: No Gift Aid check for US donations
			await test.step("Check the transaction was created", async () => {
				// Get transaction ID from webhook event if available
				if (webhookEvent.donorfy_transaction_id) {
					const transaction = await donorfyUS.getTransaction(
						webhookEvent.donorfy_transaction_id
					);

					await test.step("Verify transaction details", async () => {
						const expectedCampaign =
							testDetails.campaign || testDetails.defaultCampaign;
						expect(transaction.Campaign).toEqual(expectedCampaign);
						expect(transaction.PaymentMethod).toEqual("Stripe Checkout");
						expect(transaction.Amount).toEqual(testDetails.amount);
						expect(transaction.FundList).toEqual(
							testDetails.projectId || testDetails.fund || "Unrestricted"
						);
						expect(transaction.UtmSource).toEqual(
							testDetails.utmSource || "unknown"
						);
						expect(transaction.UtmMedium).toEqual(
							testDetails.utmMedium || "unknown"
						);
						expect(transaction.UtmCampaign).toEqual(
							testDetails.utmCampaign || "unknown"
						);
					});
				}
			});

			await test.step("Check for tags", async () => {
				const tags = await donorfyUS.getConstituentTags(constituentId);
				if (testDetails.inspiration) {
					expect(tags).toEqual(
						expect.stringContaining(testDetails.inspiration)
					);
				}
				expect(tags).toEqual(expect.stringContaining(testDetails.projectId));
				if (testDetails.donorType === "organisation") {
					expect(tags).toEqual(
						expect.stringContaining("FreedomFoundation_Type Organisation")
					);
				}
			});
		});

		/*
		Check Mailchimp Details
		*/
		// await test.step("Check Mailchimp Details", async () => {
		// 	// For US, email preferences are defaulted to true
		// 	const subscriber = await getSubscriber(testEmail, "us");

		// 	await test.step("Check email is subscribed", async () => {
		// 		expect(subscriber.status).toEqual("subscribed");
		// 	});

		// 	await test.step("Check merge fields", async () => {
		// 		expect(subscriber.merge_fields.FNAME).toEqual(testDetails.firstName);
		// 		expect(subscriber.merge_fields.LNAME).toEqual(testDetails.lastName);
		// 	});

		// 	// Check for any organization merge field if provided
		// 	if (testDetails.organisationName) {
		// 		await test.step("Check organization merge field", async () => {
		// 			expect(subscriber.merge_fields.ORG).toEqual(
		// 				testDetails.organisationName
		// 			);
		// 		});
		// 	}
		// });
	});

	//delete after test
	test.afterAll(async () => {
		if (deleteAfterTest) {
			// Delete the test constituents from Donorfy
			for (const email of emails) {
				try {
					const constituentId = await pollForConstituent(email, "us");
					console.log("pollForConstituent", constituentId);
					await donorfyUS.deleteConstituent(constituentId); // Use US instance
					console.log(`Deleted Donorfy constituent: ${constituentId}`);
				} catch (err) {
					console.warn(`Failed to delete Donorfy constituent: ${err}`);
				}
				// Clean up Mailchimp subscriber off due to rate limiting
				// try {
				// 	await deleteSubscriber(email, "us"); // Use US instance
				// 	console.log("Deleted Mailchimp Subscriber");
				// } catch (err) {
				// 	console.warn(`Failed to delete Mailchimp subscriber: ${err}`);
				// }
			}
		}
	});
});
