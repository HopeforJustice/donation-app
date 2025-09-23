import { test, expect } from "@playwright/test";
import fillUsOnce from "./helpers/formCompletions/usOnce";
import pollForConstituent from "./helpers/pollForConstituent";
import pollForPayPalEvent from "./helpers/pollForPayPalEvent";
import { getDonorfyClient } from "@/app/lib/utils/apiUtils";

const donorfyUS = getDonorfyClient("us");

// Default campaign: Donation App General Campaign

const deleteAfterTest = true;
const testDetails = {
	fund: null,
	frequency: "once",
	amount: 12.0,
	firstName: "James",
	lastName: "Holt",
	phoneNumber: "07777777777",
	address1: "10 Test Place",
	address2: "Test Area",
	townCity: "Test City",
	postalCode: "LS7 2TD",
	state: "California",
	country: "United States",
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
	gateway: "paypal",
	paypal: {
		email: "sb-4ndei45397769@personal.example.com",
		password: "X.[gK6-A",
	},
	utmSource: "test_source",
	utmMedium: "test_medium",
	utmCampaign: "test_campaign",
	donorType: "individual",
	organisationName: "Test Organisation",
	givingTo: "Test Project",
	projectId: "PP1006 Advocacy",
};

//store constituents for deletion
const constituents = [];

//store emails for deletion
const emails = [];

test.describe("E2E: Test one off giving via PayPal", () => {
	test("Should test a successful PayPal Transaction", async ({ page }) => {
		const timestamp = Date.now();
		const testEmail = `james.holt+oneoffukpaypalff${timestamp}@hopeforjustice.org`;
		let constituentId;
		let webhookEvent;
		emails.push(testEmail);

		await test.step("Fill in the form with test details", async () => {
			await fillUsOnce(page, {
				email: testEmail,
				...testDetails,
			});
		});

		await test.step("Wait for redirect to success page and verify", async () => {
			await page.waitForURL("**/success**");
			await expect(page.getByRole("heading")).toContainText("Thank you");
		});

		// probably poll for processed event
		await test.step("Poll for webhook event processing", async () => {
			webhookEvent = await pollForPayPalEvent(testEmail);
			expect(webhookEvent).toBeDefined();
			constituentId = webhookEvent.constituent_id;
			expect(webhookEvent.status).toBe("processed");
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
						County: testDetails.state,
						Phone1: testDetails.phoneNumber,
					})
				);
			});

			await test.step("Get the Constituent's preferences and check details", async () => {
				const getConstituentPreferencesResult =
					await donorfyUS.getConstituentPreferences(constituentId);
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

			await test.step("Check the transaction was created", async () => {
				if (webhookEvent.donorfy_transaction_id) {
					const transaction = await donorfyUS.getTransaction(
						webhookEvent.donorfy_transaction_id
					);

					await test.step("Verify transaction details", async () => {
						const expectedCampaign =
							testDetails.campaign || testDetails.defaultCampaign;
						expect(transaction.Campaign).toEqual(expectedCampaign);
						expect(transaction.PaymentMethod).toEqual("PayPal");
						expect(transaction.Amount).toEqual(testDetails.amount);
						expect(transaction.FundList).toEqual(
							testDetails.projectId || testDetails.fund || "Unrestricted"
						);
					});
				}
			});
		});
	});
	//delete after test
	test.afterAll(async () => {
		if (deleteAfterTest) {
			// Delete the test constituents from Donorfy
			for (const email of emails) {
				try {
					const constituentId = await pollForConstituent(email, "us");
					console.log("pollForConstituent", constituentId);
					await donorfyUS.deleteConstituent(constituentId);
					console.log(`Deleted Donorfy constituent: ${constituentId}`);
				} catch (err) {
					console.warn(`Failed to delete Donorfy constituent: ${err}`);
				}
			}
		}
	});
});
