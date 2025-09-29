/*
 * End to End Test: One off card payments via Stripe UK
 * Integrations tested
 * - Stripe
 * - Donorfy
 * - Mailchimp
 */

import { test, expect } from "@playwright/test";
import fillUkOnce from "./helpers/formCompletions/ukOnce";
import getSubscriber from "@/app/lib/mailchimp/getSubscriber";
import deleteSubscriber from "@/app/lib/mailchimp/deleteSubscriber";
import pollForConstituent from "./helpers/pollForConstituent";
import pollForStripeWebhookEvent from "./helpers/pollForStripeWebhookEvent";
import { getDonorfyClient } from "@/app/lib/utils/apiUtils";

const donorfyUK = getDonorfyClient("uk");

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
		//email:true to test mailchimp
		email: true,
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
	donorType: "organisation",
	organisationName: "Test Organisation",
	givingTo: "Test Project",
	projectId: "PP1006 Advocacy",
};

//store constituents for deletion
const constituents = [];

//store emails for deletion
const emails = [];

test.describe("E2E: Test one off giving via Stripe", () => {
	test("Should test a successful card", async ({ page }) => {
		const timestamp = Date.now();
		const testEmail = `james.holt+oneoffukff${timestamp}@hopeforjustice.org`;
		emails.push(testEmail);
		let constituentId;
		let webhookEvent;

		/*
		Fill in the form(s)
		*/
		await test.step("Fill the donation form with test details", async () => {
			await fillUkOnce(page, {
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
			expect(params.get("currency")).toBe("gbp");
			expect(params.get("gateway")).toBe("stripe");
			expect(Number(params.get("amount"))).toBe(testDetails.amount);
		});

		/*
		Poll for webhook event processing
		*/
		await test.step("Poll for Stripe webhook event", async () => {
			webhookEvent = await pollForStripeWebhookEvent(
				testEmail,
				"gbp", // Currency for UK test
				"checkout.session.completed"
			);
			expect(webhookEvent).toBeTruthy();
			expect(webhookEvent.status).toBe("processed");
		});

		/*
		Get constituent ID and validate Donorfy integration
		*/
		await test.step("Get constituent ID from Donorfy", async () => {
			constituentId = await pollForConstituent(testEmail, "uk");
			expect(constituentId).toBeTruthy();
		});

		/*
		Check Donorfy Details
		*/
		await test.step("Check Donorfy Details", async () => {
			await test.step("Get the Constituent and check details", async () => {
				const constituentData = await donorfyUK.getConstituent(constituentId);
				expect(constituentData.EmailAddress).toBe(testEmail);
				expect(constituentData).toEqual(
					expect.objectContaining({
						Title: testDetails.title,
						FirstName: testDetails.firstName,
						LastName: testDetails.lastName,
						AddressLine1: testDetails.address1,
						AddressLine2: testDetails.address2,
						Town: testDetails.townCity,
						PostalCode: testDetails.postalCode,
						Country: testDetails.country,
						Phone1: testDetails.phoneNumber,
					})
				);
			});

			await test.step("Get the Constituent's preferences and check details", async () => {
				const getConstituentPreferencesResult =
					await donorfyUK.getConstituentPreferences(constituentId);
				const preferencesArray =
					getConstituentPreferencesResult.PreferencesList;

				// Check Channel Preferences
				const channelPreferences = {};
				preferencesArray
					.filter((pref) => pref.PreferenceType === "Channel")
					.forEach((pref) => {
						const key =
							pref.PreferenceName === "Mail" ? "Post" : pref.PreferenceName;
						channelPreferences[key] = pref.PreferenceAllowed;
					});

				expect(channelPreferences).toEqual(
					expect.objectContaining({
						Email: testDetails.preferences.email,
						Post: testDetails.preferences.post,
						SMS: testDetails.preferences.sms,
						Phone: testDetails.preferences.phone,
					})
				);

				//Check "Email Updates" Purpose
				const emailUpdatesPref = preferencesArray.find(
					(pref) =>
						pref.PreferenceType === "Purpose" &&
						pref.PreferenceName === "Email Updates"
				);

				expect(emailUpdatesPref?.PreferenceAllowed).toBe(
					testDetails.preferences.email
				);
			});

			await test.step("Get the Constituent's GiftAid declarations and check details", async () => {
				if (!testDetails.giftAid) {
					console.log("Gift Aid set to false in test details");
					test.info().annotations.push({
						type: "skip-step",
						description: "Skipped check for the GiftAid: set to false",
					});
					return;
				}
				const giftAidData = await donorfyUK.getConstituentGiftAidDeclarations(
					constituentId
				);
				const mostRecent = giftAidData.GiftAidDeclarationsList[0];
				const now = new Date();
				const declarationDate = new Date(mostRecent.DeclarationDate);
				const sameDay =
					now.getFullYear() === declarationDate.getFullYear() &&
					now.getMonth() === declarationDate.getMonth() &&
					now.getDate() === declarationDate.getDate();
				expect(sameDay).toBe(true);
			});

			await test.step("Check the transaction was created", async () => {
				// Get transaction ID from webhook event if available
				if (webhookEvent.donorfy_transaction_id) {
					const transaction = await donorfyUK.getTransaction(
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
						expect(transaction.UtmSource).toEqual(testDetails.utmSource);
						expect(transaction.UtmMedium).toEqual(testDetails.utmMedium);
						expect(transaction.UtmCampaign).toEqual(testDetails.utmCampaign);
					});
				}
			});

			await test.step("Check for tags", async () => {
				const tags = await donorfyUK.getConstituentTags(constituentId);
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
		// 	if (!testDetails.preferences.email) {
		// 		console.log("Email not set to true in test");
		// 		test.info().annotations.push({
		// 			type: "skip-step",
		// 			description: "Skipped Mailchimp Check: email preference set to false",
		// 		});
		// 		return;
		// 	}

		// 	const subscriber = await getSubscriber(testEmail, "uk");

		// 	await test.step("Check email is subscribed", async () => {
		// 		expect(subscriber.status).toEqual("subscribed");
		// 	});

		// 	await test.step("Check merge fields", async () => {
		// 		expect(subscriber.merge_fields.FNAME).toEqual(testDetails.firstName);
		// 		expect(subscriber.merge_fields.LNAME).toEqual(testDetails.lastName);
		// 	});

		// 	await test.step("Check email updates group", async () => {
		// 		expect(subscriber.interests["60a2c211ce"]).toEqual(
		// 			testDetails.preferences.email
		// 		);
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
					const constituentId = await pollForConstituent(email, "uk");
					console.log("pollForConstituent", constituentId);
					await donorfyUK.deleteConstituent(constituentId);
					console.log(`Deleted Donorfy constituent: ${constituentId}`);
				} catch (err) {
					console.warn(`Failed to delete Donorfy constituent: ${err}`);
				}
				// Clean up Mailchimp subscriber off due to rate limiting
				// try {
				// 	await deleteSubscriber(email, "uk");
				// 	console.log("Deleted Mailchimp Subscriber");
				// } catch (err) {
				// 	console.warn(`Failed to delete Mailchimp subscriber: ${err}`);
				// }
			}
		}
	});
});
