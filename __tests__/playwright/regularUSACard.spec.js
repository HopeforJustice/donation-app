/*
 * End to End Test: Regular subscription payments via Stripe USA
 * Integrations tested
 * - Stripe Subscriptions
 * - Donorfy
 * - Mailchimp
 */

import { test, expect } from "@playwright/test";
import fillUSRegular from "./helpers/formCompletions/usRegular";
import getSubscriber from "@/app/lib/mailchimp/getSubscriber";
import deleteSubscriber from "@/app/lib/mailchimp/deleteSubscriber";
import pollForConstituent from "./helpers/pollForConstituent";
import pollForStripeWebhookEvent from "./helpers/pollForStripeWebhookEvent";
import advanceTestClock from "./helpers/advanceTestClock";
import { getStripeInstance } from "@/app/lib/stripe/getStripeInstance";
import pollForActivityType from "./helpers/pollForActivityType";
import { getDonorfyClient } from "@/app/lib/utils/apiUtils";

const stripe = getStripeInstance({ currency: "usd", mode: "test" });

const donorfyUS = getDonorfyClient("us");

// Default campaign: Donation App General Campaign

const deleteAfterTest = true;
const testDetails = {
	fund: null,
	frequency: "monthly",
	amount: 20,
	firstName: "James",
	lastName: "Holt",
	phoneNumber: "07777777777",
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

test.describe("E2E: Test regular giving via Stripe USA", () => {
	test("Should test a successful subscription", async ({ page }) => {
		const timestamp = Date.now();
		const testEmail = `james.holt+regularusa${timestamp}@hopeforjustice.org`;
		emails.push(testEmail);
		let constituentId;
		let subscriptionWebhookEvent;
		let invoiceWebhookEvent;
		let testClockId;
		let testCustomerId;

		// Intercept checkout session creation to capture test clock ID
		await page.route("**/api/createCheckoutSession", async (route) => {
			console.log("Intercepted createCheckoutSession API call");
			const response = await route.fetch();
			const responseData = await response.json();

			// Store test clock information for later use
			if (responseData.testClockId) {
				testClockId = responseData.testClockId;
				testCustomerId = responseData.testCustomerId;
				console.log(`Captured test clock ID: ${testClockId}`);
				console.log(`Captured test customer ID: ${testCustomerId}`);
			} else {
				console.log("No test clock ID found in response");
			}

			await route.fulfill({ response });
		});

		/*
		Fill in the form(s)
		*/
		await test.step("Fill the donation form with test details", async () => {
			await fillUSRegular(page, {
				stripe: { pathway: "successful card" },
				email: testEmail,
				...testDetails,
			});
		});

		await test.step("Verify successful subscription setup completion", async () => {
			await expect(
				page.getByRole("heading", { name: /Thank You/i })
			).toBeVisible({ timeout: 10000 });
		});

		await test.step("Check URL parameters", async () => {
			const url = page.url();
			console.log("Success URL", url);
			const params = new URL(url).searchParams;
			expect(params.get("frequency")).toBe("monthly");
			expect(params.get("currency")).toBe("usd");
			expect(params.get("gateway")).toBe("stripe");
			expect(Number(params.get("amount"))).toBe(testDetails.amount);
		});

		/*
		Poll for subscription creation webhook event
		*/
		await test.step("Poll for Stripe subscription creation webhook event", async () => {
			subscriptionWebhookEvent = await pollForStripeWebhookEvent(
				testEmail,
				"usd", // Currency for US test
				"customer.subscription.created"
			);
			expect(subscriptionWebhookEvent).toBeTruthy();
			expect(subscriptionWebhookEvent.status).toBe("processed");
		});

		/*
		Poll for initial payment webhook event
		*/
		await test.step("Poll for Stripe initial payment webhook event", async () => {
			invoiceWebhookEvent = await pollForStripeWebhookEvent(
				testEmail,
				"usd",
				"invoice.payment_succeeded"
			);
			expect(invoiceWebhookEvent).toBeTruthy();
			expect(invoiceWebhookEvent.status).toBe("processed");
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

			await test.step("Check subscription activity was created", async () => {
				const constituentActivities = await donorfyUS.getConstituentActivities(
					constituentId
				);
				let foundSubscriptionActivity = false;
				let foundInspirationActivity = false;

				for (const activity of constituentActivities.ActivitiesList) {
					if (activity.ActivityType === "Stripe Subscription Created") {
						expect(activity.Number1).toEqual(testDetails.amount);
						foundSubscriptionActivity = true;
					}
					if (activity.ActivityType === "Donation inspiration") {
						expect(activity.Notes).toBe(testDetails.inspirationNotes);
						foundInspirationActivity = true;
					}
				}

				expect(foundSubscriptionActivity).toBe(true);
				if (testDetails.inspirationNotes) {
					expect(foundInspirationActivity).toBe(true);
				}
			});

			await test.step("Check the initial payment transaction was created", async () => {
				// Get transaction ID from invoice webhook event if available
				if (invoiceWebhookEvent.donorfy_transaction_id) {
					const transaction = await donorfyUS.getTransaction(
						invoiceWebhookEvent.donorfy_transaction_id
					);

					await test.step("Verify initial payment transaction details", async () => {
						const expectedCampaign =
							testDetails.campaign || testDetails.defaultCampaign;
						expect(transaction.Campaign).toEqual(expectedCampaign);
						expect(transaction.PaymentMethod).toEqual("Stripe Subscription");
						expect(transaction.Amount).toEqual(testDetails.amount);
						expect(transaction.FundList).toEqual(
							testDetails.fund || "Unrestricted"
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

			await test.step("Check donorfy tags", async () => {
				const tags = await donorfyUS.getConstituentTags(constituentId);
				console.log("Donorfy tags:", tags);
				if (testDetails.inspiration) {
					expect(tags).toEqual(
						expect.stringContaining(testDetails.inspiration)
					);
				}
				expect(tags).toEqual(
					expect.stringContaining("Stripe_Active Stripe Subscription")
				);
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

		// 	// Check for subscription-related tags
		// 	await test.step("Check for subscription tags", async () => {
		// 		const tags = subscriber.tags.map((tag) => tag.name);
		// 		expect(tags).toContain("Active Stripe Subscription");
		// 	});
		// });

		/*
		Test Subscription Progression - Simulate Next Billing Cycle
		Removed due to Stripe test clock issues
		*/
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
				//mailchimp cleanup. off due to rate limiting
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
