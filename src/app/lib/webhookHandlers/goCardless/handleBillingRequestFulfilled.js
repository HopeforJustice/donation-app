/**
 * Handles the "billing_request.fulfilled" webhook event from GoCardless.
 *
 * This function performs the following steps:
 * 1. Retrieves billing request and customer details from GoCardless, extracting relevant metadata.
 * 2. If the frequency is monthly, creates a subscription in GoCardless.
 * 3. If the user has opted into email communications and not in test mode, adds/updates the subscriber in Mailchimp and tags them.
 * 4. Sends a direct debit confirmation email to the customer.
 * 5. Checks for duplicate constituents in Donorfy using the customer's email.
 * 6. Finds or creates a constituent in Donorfy, updating GoCardless customer metadata with the constituent ID.
 * 7. If the constituent already exists, updates their details in Donorfy.
 * 8. Updates constituent communication preferences in Donorfy.
 * 9. If Gift Aid is enabled, creates a Gift Aid declaration in Donorfy.
 * 10. Adds active subscription and inspiration tags in Donorfy.
 * 11. Adds subscription and (optionally) inspiration activities in Donorfy.
 *
 * @async
 * @function handleBillingRequestFulfilled
 * @param {Object} event - The webhook event object from GoCardless.
 * @param {Object} event.links - Contains IDs for billing request, customer, and mandate.
 * @param {string} event.links.billing_request - The GoCardless billing request ID.
 * @param {string} event.links.customer - The GoCardless customer ID.
 * @param {string} event.links.mandate_request_mandate - The GoCardless mandate ID.
 * @returns {Promise<Object>} Result object containing status, message, eventStatus, results, customerId, and constituentId.
 * @throws {Error} Throws an error if any step fails, with additional context in the error object.
 */

import { getGoCardlessClient } from "@/app/lib/gocardless/gocardlessclient";
import addUpdateSubscriber from "../../mailchimp/addUpdateSubscriber";
import addTag from "../../mailchimp/addTag";
import sendDirectDebitConfirmationEmail from "../../sparkpost/sendDirectDebitConfirmationEmail";
import {
	getDonorfyClient,
	buildConstituentCreateData,
	buildConstituentUpdateData,
	buildConstituentPreferencesData,
} from "@/app/lib/utils";

const client = getGoCardlessClient();
const test = process.env.VERCEL_ENV !== "production";
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
		// Initialize Donorfy client (GoCardless is UK-only)
		const donorfy = getDonorfyClient("uk");

		// Extract all details needed from GoCardless
		currentStep = "Retrieve billing request details and extract metadata";
		const billingRequest = await client.billingRequests.find(billingRequestId);
		const goCardlessCustomer = await client.customers.find(customerId);
		const additionalDetails = JSON.parse(
			billingRequest.metadata.additionalDetails || "{}"
		);

		const extractedData = {
			// Customer data from GoCardless
			email: goCardlessCustomer.email,
			address1: goCardlessCustomer.address_line1,
			address2: goCardlessCustomer.address_line2,
			city: goCardlessCustomer.city,
			postalCode: goCardlessCustomer.postal_code,

			// Flattened additional details
			title: additionalDetails.title,
			firstName: additionalDetails.firstName,
			lastName: additionalDetails.lastName,
			phone: additionalDetails.phone,
			stateCounty: additionalDetails.stateCounty,
			campaign: additionalDetails.campaign,
			amount: additionalDetails.amount,
			frequency: additionalDetails.frequency,
			directDebitDay: additionalDetails.directDebitDay,
			giftAid: additionalDetails.giftAid,
			inspirationQuestion: additionalDetails.inspirationQuestion,
			inspirationDetails: additionalDetails.inspirationDetails,

			// Flattened preferences (convert strings to booleans)
			emailPreference: additionalDetails.preferences?.email === "true",
			smsPreference: additionalDetails.preferences?.sms === "true",
			phonePreference: additionalDetails.preferences?.phone === "true",
			postPreference: additionalDetails.preferences?.post === "true",
		};
		results.push({ step: currentStep, success: true });

		// Create a subscription if frequency is monthly
		if (extractedData.frequency === "monthly") {
			currentStep = "Create subscription";
			const subscription = await client.subscriptions.create({
				amount: extractedData.amount * 100,
				currency: "GBP",
				name: "Monthly Guardian",
				interval_unit: extractedData.frequency,
				day_of_month: extractedData.directDebitDay,
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
		if (extractedData.emailPreference && !test) {
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
				extractedData.amount
			);

		if (sendConfirmationEmailResponse) {
			results.push({ step: currentStep, success: true });
		} else {
			throw new Error("Failed to send confirmation email");
		}

		currentStep = "Donorfy duplicate check";
		const duplicateCheckData = await donorfy.duplicateCheck({
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
			const createConstituentInputData = buildConstituentCreateData(
				extractedData,
				extractedData.email,
				"uk",
				extractedData.campaign
			);
			const createConstituentData = await donorfy.createConstituent(
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
			const updateConstituentInputData = buildConstituentUpdateData(
				extractedData,
				duplicateCheckData[0],
				extractedData.email,
				"uk"
			);
			await donorfy.updateConstituent(
				constituentId,
				updateConstituentInputData
			);
			results.push({ step: currentStep, success: true });
		}

		currentStep = "Update Constituent preferences in Donorfy";
		const preferencesInputData = buildConstituentPreferencesData(
			extractedData,
			"uk"
		);
		await donorfy.updateConstituentPreferences(
			constituentId,
			preferencesInputData
		);
		results.push({ step: currentStep, success: true });

		// Possibly add GiftAid declaration
		if (extractedData.giftAid === "true") {
			currentStep = "Create Gift Aid declaration in Donorfy";
			await donorfy.createGiftAidDeclaration(constituentId, {
				TaxPayerTitle: extractedData.title,
				TaxPayerFirstName: extractedData.firstName,
				TaxPayerLastName: extractedData.lastName,
			});
			results.push({ step: currentStep, success: true });
		}

		// Add donorfy tags
		currentStep = "Add active subscription tag in Donorfy";
		await donorfy.addActiveTags(
			constituentId,
			"Gocardless_Active Subscription"
		);
		results.push({ step: currentStep, success: true });

		if (extractedData.inspirationQuestion) {
			currentStep = "Add inspiration tag in Donorfy";
			await donorfy.addActiveTags(
				constituentId,
				extractedData.inspirationQuestion
			);
		}
		results.push({ step: currentStep, success: true });

		//Add donorfy Activities
		currentStep = "Add Subscription Activity in Donorfy";
		const activityData = {
			Notes: `Gocardless Subscription created. Amount: ${extractedData.amount}`,
			ActivityType: "Gocardless Subscription",
			Number1: extractedData.amount,
		};
		await donorfy.addActivity({
			...activityData,
			ExistingConstituentId: constituentId,
		});
		results.push({ step: currentStep, success: true });

		if (extractedData.inspirationDetails) {
			currentStep = "Add Inspiration Activity in Donorfy";
			const inspirationActivityData = {
				Notes: extractedData.inspirationDetails,
				ActivityType: "Donation inspiration",
			};
			await donorfy.addActivity({
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
