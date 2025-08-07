/*
 * End to End Test: Setting up a Direct Debit
 * Integrations tested
 * - GoCardless
 * - Donorfy
 * - Mailchimp
 * - Sparkpost (manual confirmation needed)
 */

import { test, expect } from "@playwright/test";
import { getGoCardlessClient } from "@/app/lib/gocardless/gocardlessclient";
import pollForBillingRequest from "./helpers/pollForBillingRequest";
import DonorfyClient from "@/app/lib/donorfy/donorfyClient";
import fillDonationForm from "./helpers/fillDonationForm";
import fillGoCardlessForm from "./helpers/fillGoCardlessForm";
import getSubscriber from "@/app/lib/mailchimp/getSubscriber";
import deleteSubscriber from "@/app/lib/mailchimp/deleteSubscriber";
import pollForPaymentPaidOut from "./helpers/pollForPaymentPaidOut";
import pollForActivityType from "./helpers/pollForActivityType";

const donorfyUK = new DonorfyClient(
	process.env.DONORFY_UK_KEY,
	process.env.DONORFY_UK_TENANT
);

// Generate test email
const timestamp = Date.now();
const client = getGoCardlessClient();
const testEmail = `james.holt+test${timestamp}@hopeforjustice.org`;
let goCardlessCustomerId;
let constituentId;

// Default campaign: Donation App General Campaign

const deleteAfterTest = true;
const testDetails = {
	amount: 10,
	title: "Mr",
	firstName: "James",
	lastName: "Holt",
	phoneNumber: "07777777777",
	directDebitDay: 15,
	address1: "10 Test Place",
	address2: "Test Area",
	townCity: "Test City",
	postalCode: "LS7 2TD",
	county: "Yorkshire",
	country: "United Kingdom",
	giftAid: true,
	email: testEmail,
	preferences: {
		email: true,
		post: true,
		sms: true,
		phone: true,
	},
	inspiration: "Inspiration_Faith",
	inspirationNotes: "Test notes",
	campaign: null,
	defaultCampaign: "Donation App General Campaign",
	goCardless: {
		branchCode: "20 - 00 - 00",
		accountNumber: "55779911",
	},
};

test.describe("E2E: Setup Direct Debit", () => {
	test("Should create and validate a direct debit setup", async ({ page }) => {
		/*
		Fill in the form(s)
		*/
		await test.step("Fill the donation form with test details", async () => {
			await fillDonationForm(page, testDetails);
		});

		await test.step("Fill in and submit the GoCardless hosted form", async () => {
			test.skip();
			await fillGoCardlessForm(page, testDetails);
		});

		/*
		Poll the test database (set with env.test.local)
		*/
		let billingRequestPollResult;
		await test.step("Poll the database for the billing request event with matching test email", async () => {
			billingRequestPollResult = await pollForBillingRequest(testEmail);
		});

		/*
		Set the Ids for the rest of the test
		*/
		await test.step("Set the GoCardless Customer Id and the Donorfy Constituent Id", async () => {
			goCardlessCustomerId = billingRequestPollResult.customer.id;
			constituentId =
				billingRequestPollResult.customer.metadata.donorfyConstituentId;
			if (!goCardlessCustomerId || !constituentId) {
				throw new Error(
					"Failed to retrieve GoCardless customer ID or Donorfy constituent ID"
				);
			}
		});

		/*
		Check GoCardless
		*/
		let subscription; // will need this for further tests
		await test.step("Check GoCardless Details", async () => {
			let goCardlessCustomer;
			await test.step("Find the customer using the id", async () => {
				goCardlessCustomer = await client.customers.find(goCardlessCustomerId);
			});
			await test.step("Check the customer details", async () => {
				expect(goCardlessCustomer.given_name).toEqual(testDetails.firstName);
				expect(goCardlessCustomer.family_name).toEqual(testDetails.lastName);
				expect(goCardlessCustomer.metadata.donorfyConstituentId).toEqual(
					constituentId
				);
				const expectedCampaign = testDetails.campaign
					? testDetails.campaign
					: testDetails.defaultCampaign;
				expect(goCardlessCustomer.metadata.additionalDetails).toEqual(
					expect.stringContaining(expectedCampaign)
				);
			});
			await test.step("Find and check the Subscription using the customer id", async () => {
				const subscriptionResult = await client.subscriptions.list({
					customer: goCardlessCustomerId,
				});
				expect(subscriptionResult.subscriptions.length).toEqual(1);
				subscription = subscriptionResult.subscriptions[0];
				expect(subscription.status).toEqual("active");
				expect(subscription.amount).toEqual(testDetails.amount * 100);
				expect(subscription.day_of_month).toEqual(testDetails.directDebitDay);
			});
		});

		/*
		Check Donorfy
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
						County: testDetails.county,
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
						description: "Skipped check for the GiftAid: swt to false",
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

			await test.step("Get the Constituent's Activities and check details", async () => {
				const constituentActivities = await donorfyUK.getConstituentActivities(
					constituentId
				);
				let foundInspirationActivity = false;
				let foundSubscriptionActivity = false;

				for (const activity of constituentActivities.ActivitiesList) {
					if (activity.ActivityType === "Donation inspiration") {
						expect(activity.Notes === testDetails.inspirationNotes);
						foundInspirationActivity = true;
					}
					if (activity.ActivityType === "Gocardless Subscription") {
						expect(activity.Nunber1 === testDetails.amount);
						foundSubscriptionActivity = true;
					}
				}
				await test.step("Check the Inspiration Activity", async () => {
					if (testDetails.inspirationNotes !== "") {
						expect(foundInspirationActivity).toEqual(true);
					} else {
						console.log("No Inspiration details set");
						test.info().annotations.push({
							type: "skip-step",
							description:
								"Skipped check for the Inspiration notes: no details set",
						});
						return;
					}
				});

				await test.step("Check the Subscription Activity", async () => {
					expect(foundSubscriptionActivity).toEqual(true);
				});
			});

			await test.step("Check the Constituent's Tags", async () => {
				const tags = await donorfyUK.getConstituentTags(constituentId);
				await test.step("Check for the Active Subscription tag", async () => {
					expect(tags).toEqual(
						expect.stringContaining("Gocardless_Active Subscription")
					);
				});

				await test.step("Check for the Inspiration tag", async () => {
					if (testDetails.inspiration === "") {
						console.log("No Inspiration tag set");
						test.info().annotations.push({
							type: "skip-step",
							description:
								"Skipped check for the Inspiration tag: no details set",
						});
						return;
					}
					expect(tags).toEqual(expect.stringContaining("Inspiration_Faith"));
				});
			});
		});

		/*
		Check Mailchimp
		*/
		await test.step("Check Mailchimp Details", async () => {
			if (!testDetails.preferences.email) {
				console.log("Email not set to true in test");
				test.info().annotations.push({
					type: "skip-step",
					description: "Skipped Mailchimp Check: no details set",
				});
				return;
			}
			const subscriber = await getSubscriber(testEmail, "uk");
			await test.step("Check email is subscribed", async () => {
				expect(subscriber.status).toEqual("subscribed");
			});
			await test.step("Check email updates group", async () => {
				expect(subscriber.interests["60a2c211ce"]).toEqual(true);
			});
			await test.step("Check for active subscription tag", async () => {
				expect(
					subscriber.tags.some(
						(tag) => tag.name === "GoCardless Active Subscription"
					)
				).toEqual(true);
			});
		});

		/* 
		Simulate a "payment paid out" event in GoCardless
		*/
		const mandatesList = await client.mandates.list({
			customer: goCardlessCustomerId,
		});
		await test.step("Test a payment from GoCardless", async () => {
			await test.step("Transition mandate to active and simulate a payment", async () => {
				const payment = await client.payments.create({
					amount: 1000,
					currency: "GBP",
					links: {
						mandate: mandatesList.mandates[0].id,
					},
				});
				await client.scenarioSimulators.run("mandate_activated", {
					links: {
						resource: mandatesList.mandates[0].id,
					},
				});
				await client.scenarioSimulators.run("payment_paid_out", {
					links: {
						resource: payment.id,
					},
				});
			});
			let paymentPollResult;
			await test.step("Poll the database for the payment event with matching test email", async () => {
				paymentPollResult = await pollForPaymentPaidOut(testEmail);
			});
			await test.step("Check the transaction in Donorfy", async () => {
				const transaction = await donorfyUK.getTransaction(
					paymentPollResult.event.donorfy_transaction_id
				);
				await test.step("Has the transaction details", async () => {
					const expectedCampaign = testDetails.campaign
						? testDetails.campaign
						: testDetails.defaultCampaign;
					const expectedChannel = "Gocardless Subscription";
					const expectedPaymentMethod = "GoCardless DD";
					expect(transaction.Campaign).toEqual(expectedCampaign);
					expect(transaction.Channel).toEqual(expectedChannel);
					expect(transaction.PaymentMethod).toEqual(expectedPaymentMethod);
					expect(transaction.Amount).toEqual(testDetails.amount);
				});
			});
		});

		/* 
		Simulate a "payment failed" event in GoCardless
		*/
		await test.step("Test a failed payment from GoCardless", async () => {
			await test.step("Simulate the scenario", async () => {
				const payment = await client.payments.create({
					amount: 1000,
					currency: "GBP",
					links: {
						mandate: mandatesList.mandates[0].id,
					},
				});
				await client.scenarioSimulators.run("payment_failed", {
					links: {
						resource: payment.id,
					},
				});
			});
			await test.step("Check the failed payment activity exists", async () => {
				const activity = await pollForActivityType(
					constituentId,
					"Gocardless Payment Failed"
				);
				expect(activity.ActivityType).toEqual("Gocardless Payment Failed");
			});
		});

		/* 
		Cancel the Subscription in GoCardless
		*/
		await test.step("Test a cancelled subscription", async () => {
			await test.step("Cancel the subscription", async () => {
				//cancel the subscription
				try {
					await client.subscriptions.cancel(subscription.id);
				} catch (error) {
					console.error(error);
				}
			});
			await test.step("Check the Donorfy constituent has the cancelled activity", async () => {
				//check for activity in Donorfy
				const activity = await pollForActivityType(
					constituentId,
					"Gocardless Subscription Cancelled"
				);
				expect(activity.ActivityType).toEqual(
					"Gocardless Subscription Cancelled"
				);
			});

			await test.step("Check the Donorfy constituent has NOT got the active subscription tag", async () => {
				const tags = await donorfyUK.getConstituentTags(constituentId);
				expect(tags).not.toContain("Gocardless_Active Subscription");
			});

			//check active tag is removed in mailchimp (if applicable)
			if (testDetails.email) {
				await test.step("Check the Mailchimp subscriber does not have the active subscription tag", async () => {
					const subscriber = await getSubscriber(testEmail, "uk");
					expect(subscriber.tags_count).toEqual(0);
				});
			}
		});
	});

	// Clean up the test data
	test.afterEach(async () => {
		if (deleteAfterTest) {
			// Clean up GoCardless
			if (goCardlessCustomerId) {
				try {
					// List all mandates associated with a given customer.
					const mandatesList = await client.mandates.list({
						customer: goCardlessCustomerId,
					});
					// Then delete each of them
					const mandates = mandatesList.mandates;
					for (const mandate of mandates) {
						await client.mandates.cancel(mandate.id);
						console.log(`Cancelled GoCardless mandate: ${mandate.id}`);
					}
					// Once mandates have been cancelled, delete the customer
					await client.customers.remove(goCardlessCustomerId);
					console.log(`Deleted GoCardless customer: ${goCardlessCustomerId}`);
				} catch (err) {
					console.warn(`Failed to delete GoCardless customer: ${err}`);
				}
			}

			// Clean up Donorfy constituent
			if (constituentId) {
				try {
					await donorfyUK.deleteConstituent(constituentId);
					console.log(`Deleted Donorfy constituent: ${constituentId}`);
				} catch (err) {
					console.warn(`Failed to delete Donorfy constituent: ${err}`);
				}
			}
			// Clean up mailchimp
			if (testDetails.preferences.email) {
				try {
					await deleteSubscriber(testEmail, "uk");
					console.log("Deleted Mailchimp Subscriber");
				} catch (err) {
					console.warn(`Failed to delete Mailchimp subscriber: ${err}`);
				}
			}
		}
	});
});
