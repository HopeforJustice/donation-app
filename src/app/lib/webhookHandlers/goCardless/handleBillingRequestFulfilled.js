/*
 * handleBillingRequestFulfilled.js
 * Function for handling GoCardless webhook event for billing request fulfilled
 *
 * Webhook event sent from Gocardless to api/webhooks/gocardless
 *
 * Exctract "additionalDetails" from billing request metadata
 * Create supscription in GoCardless (using additional details if frequency is monthly)
 * Update Customer metadata in GoCardless so "additionalDetails" is attached to customer instead of billing request
 * Add/Update subscriber in Mailchimp (if selected preference is yes to email)
 * Send sparkpost email (regardless of consent as this is transactional)
 * Update Donorfy (donorfy/newGoCardlessSubscriber.js)
 *
 */

import { getGoCardlessClient } from "@/app/lib/gocardless/gocardlessclient";
import addUpdateSubscriber from "../../mailchimp/addUpdateSubscriber";
import addTag from "../../mailchimp/addTag";
import sendDirectDebitConfirmationEmail from "../../sparkpost/sendDirectDebitConfirmationEmail";
import DonorfyClient from "@/app/lib/donorfy/donorfyClient";
const client = getGoCardlessClient();
const donorfyUK = new DonorfyClient(
	process.env.DONORFY_UK_KEY,
	process.env.DONORFY_UK_TENANT
);
export const runtime = "nodejs";

export async function handleBillingRequestFulfilled(event) {
	const {
		billing_request: billingRequestId,
		customer: customerId,
		mandate_request_mandate: mandateId,
	} = event.links;

	const results = [];
	let currentStep = "";
	let constituentId = null;
	let alreadyInDonorfy = false;

	try {
		// Extract all details needed from GoCardless
		currentStep = "Retrieve billing request details and extract metadata";
		const billingRequest = await client.billingRequests.find(billingRequestId);
		const goCardlessCustomer = await client.customers.find(customerId);
		const additionalDetails = JSON.parse(
			billingRequest.metadata.additionalDetails || "{}"
		);

		const extractedData = {
			additionalDetails: additionalDetails,
			email: goCardlessCustomer.email,
			title: additionalDetails.title,
			firstName: additionalDetails.firstName,
			lastName: additionalDetails.lastName,
			address1: goCardlessCustomer.address_line1,
			address2: goCardlessCustomer.address_line2,
			stateCounty: additionalDetails.stateCounty,
			city: goCardlessCustomer.city,
			postalCode: goCardlessCustomer.postal_code,
		};
		results.push({ step: currentStep, success: true });

		// Create a subscription if frequency is monthly
		if (extractedData.additionalDetails.frequency === "monthly") {
			currentStep = "Create subscription";
			const subscription = await client.subscriptions.create({
				amount: extractedData.additionalDetails.amount * 100,
				currency: "GBP",
				name: "Monthly Guardian",
				interval_unit: extractedData.additionalDetails.frequency,
				day_of_month: extractedData.additionalDetails.directDebitDay,
				links: { mandate: mandateId },
			});

			if (subscription.id) {
				results.push({ step: currentStep, success: true });
			} else {
				results.push({ step: currentStep, success: false });
				throw new Error("Failed to create subscription in GoCardless");
			}
		}

		/*
		 * If the constituent has said yes to email comms
		 * Add them to Mailchimp with an "GoCardless Active Subscription" tag
		 */
		if (extractedData.additionalDetails.preferences.email === "true") {
			currentStep = "Add/Update subscriber in Mailchimp";
			await addUpdateSubscriber(
				extractedData.email,
				extractedData.firstName,
				extractedData.lastName,
				"subscribed",
				"uk"
			);

			results.push({ step: currentStep, success: true });

			currentStep = "Add subscriber tag in Mailchimp";
			await addTag(extractedData.email, "GoCardless Active Subscription", "uk");
			results.push({ step: currentStep, success: true });
		}

		currentStep = "Send confirmation email";
		const sendConfirmationEmailResponse =
			await sendDirectDebitConfirmationEmail(
				extractedData.email,
				extractedData.firstName,
				extractedData.additionalDetails.amount
			);

		if (sendConfirmationEmailResponse) {
			results.push({ step: currentStep, success: true });
		} else {
			throw new Error("Failed to send confirmation email");
		}

		currentStep = "Donorfy duplicate check";
		const duplicateCheckData = await donorfyUK.duplicateCheck({
			EmailAddress: extractedData.email,
		});
		results.push({ step: currentStep, success: true });

		// Find or create Constituent
		if (duplicateCheckData.length > 0 && duplicateCheckData[0].Score >= 15) {
			currentStep = "Retrieve Constituent";
			constituentId = duplicateCheckData[0].ConstituentId;
			alreadyInDonorfy = true;
			results.push({ step: currentStep, success: true });
		} else {
			currentStep = "Create Constituent";
			const createConstituentInputData = {
				ConstituentType: "individual",
				Title: extractedData.additionalDetails.title || "",
				FirstName: extractedData.firstName || "",
				LastName: extractedData.lastName || "",
				AddressLine1: extractedData.address1 || "",
				AddressLine2: extractedData.address2 || "",
				Town: extractedData.city || "",
				County: extractedData.stateCounty || "",
				PostalCode: extractedData.postalCode || "",
				EmailAddress: extractedData.email || "",
				Phone1: extractedData.additionalDetails.phone || "",
				RecruitmentCampaign: extractedData.additionalDetails.campaign || "",
			};
			const createConstituentData = await donorfyUK.createConstituent(
				createConstituentInputData
			);
			constituentId = createConstituentData.ConstituentId;
			results.push({ step: currentStep, success: true });
		}

		//Update GoCardless customer metadata
		currentStep = "Update GoCardless customer metadata";
		await client.customers.update(goCardlessCustomer.id, {
			metadata: {
				donorfyConstituentId: constituentId,
				additionalDetails: billingRequest.metadata.additionalDetails,
			},
		});
		results.push({ step: currentStep, success: true });

		//Possibly update constituent
		if (alreadyInDonorfy) {
			currentStep = "Update Constituent details in Donorfy";
			const updateConstituentInputData = {
				Title: extractedData.additionalDetails.title || "Mr",
				FirstName: extractedData.firstName || "",
				LastName: extractedData.lastName || "",
				AddressLine1: extractedData.address1 || "",
				AddressLine2: extractedData.address2 || "",
				Town: extractedData.city || "",
				County: extractedData.stateCounty || "",
				PostalCode: extractedData.postalCode || "",
				Phone1: extractedData.additionalDetails.phone || "",
			};
			await donorfyUK.updateConstituent(
				constituentId,
				updateConstituentInputData
			);
			results.push({ step: currentStep, success: true });
		}

		currentStep = "Update Constituent preferences in Donorfy";
		const updatePreferencesData = {
			PreferencesList: [
				{
					PreferenceType: "Channel",
					PreferenceName: "Email",
					PreferenceAllowed: extractedData.additionalDetails.preferences.email,
				},
				{
					PreferenceType: "Channel",
					PreferenceName: "Mail",
					PreferenceAllowed: extractedData.additionalDetails.preferences.post,
				},
				{
					PreferenceType: "Channel",
					PreferenceName: "Phone",
					PreferenceAllowed: extractedData.additionalDetails.preferences.phone,
				},
				{
					PreferenceType: "Channel",
					PreferenceName: "SMS",
					PreferenceAllowed: extractedData.additionalDetails.preferences.sms,
				},
				{
					PreferenceType: "Purpose",
					PreferenceName: "Email Updates",
					PreferenceAllowed: extractedData.additionalDetails.preferences.email,
				},
			],
		};
		await donorfyUK.updateConstituentPreferences(
			constituentId,
			updatePreferencesData
		);
		results.push({ step: currentStep, success: true });

		// Possibly add GiftAid declaration
		if (extractedData.additionalDetails.giftAid === "true") {
			currentStep = "Create Gift Aid declaration in Donorfy";
			await donorfyUK.createGiftAidDeclaration(constituentId, {
				TaxPayerTitle: extractedData.additionalDetails.title,
				TaxPayerFirstName: extractedData.firstName,
				TaxPayerLastName: extractedData.lastName,
			});
			results.push({ step: currentStep, success: true });
		}

		// Add donorfy tags
		currentStep = "Add active subscription tag in Donorfy";
		await donorfyUK.addActiveTags(
			constituentId,
			"Gocardless_Active Subscription"
		);
		results.push({ step: currentStep, success: true });

		if (extractedData.additionalDetails.inspirationQuestion) {
			currentStep = "Add inspiration tag in Donorfy";
			await donorfyUK.addActiveTags(
				constituentId,
				extractedData.additionalDetails.inspirationQuestion
			);
		}
		results.push({ step: currentStep, success: true });

		//Add donorfy Activities
		currentStep = "Add Subscription Activity in Donorfy";
		const activityData = {
			Notes: `Gocardless Subscription created. Amount: ${extractedData.additionalDetails.amount}`,
			ActivityType: "Gocardless Subscription",
			Number1: extractedData.additionalDetails.amount,
		};
		await donorfyUK.addActivity({
			...activityData,
			ExistingConstituentId: constituentId,
		});
		results.push({ step: currentStep, success: true });

		if (extractedData.additionalDetails.inspirationDetails) {
			currentStep = "Add Inspiration Activity in Donorfy";
			const inspirationActivityData = {
				Notes: extractedData.additionalDetails.inspirationDetails,
				ActivityType: "Donation inspiration",
			};
			await donorfyUK.addActivity({
				...inspirationActivityData,
				ExistingConstituentId: constituentId,
			});
			results.push({ step: currentStep, success: true });
		}

		return {
			message: `GoCardless customer ${customerId} subscription created. Successfully logged in Donorfy with constituent ID ${constituentId}`,
			status: 200,
			eventStatus: "processed",
			results,
			customerId,
			constituentId,
		};
	} catch (error) {
		results.push({ step: currentStep, success: false });
		error.results = results;
		error.goCardlessCustomerId = customerId || null;
		error.constituentId = constituentId || null;
		throw error;
	}
}
