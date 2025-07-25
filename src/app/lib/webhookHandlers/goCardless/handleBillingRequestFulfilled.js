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
import { sanitiseForLogging, stripMetadata } from "@/app/lib/utilities";
import newGoCardlessSubscriber from "../../donorfy/newGoCardlessSubscriber";

const client = getGoCardlessClient();
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

	try {
		// Extract all details needed from GoCardless
		currentStep = "Retrieve billing request details and extract metadata";
		const billingRequest = await client.billingRequests.find(billingRequestId);
		const goCardlessCustomer = await client.customers.find(customerId);

		const extractedData = {
			additionalDetails: JSON.parse(billingRequest.metadata.additionalDetails),
			email: goCardlessCustomer.email,
			title: billingRequest.metadata.additionalDetails.title,
			firstName: billingRequest.metadata.additionalDetails.firstName,
			lastName: billingRequest.metadata.additionalDetails.lastName,
			address1: goCardlessCustomer.address_line1,
			address2: goCardlessCustomer.address_line2,
			city: goCardlessCustomer.city,
			postalCode: goCardlessCustomer.postal_code,
		};
		results.push({ step: currentStep, success: true });
		console.log(sanitiseForLogging(extractedData));

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
				console.log("subscription Created", subscription.id);
				results.push({ step: currentStep, success: true });
			} else {
				results.push({ step: currentStep, success: false });
				throw new Error("Failed to create subscription in GoCardless");
			}
		}

		//Update customer metadata in GoCardless
		currentStep = "Update customer metadata in GoCardless";
		const updateCustomer = await client.customers.update(customerId, {
			metadata: {
				additionalDetails: billingRequest.metadata.additionalDetails,
			},
		});

		if (updateCustomer) {
			results.push({ step: currentStep, success: true });
		} else {
			results.push({ step: currentStep, success: false });
			throw new Error("Failed to update Customer in GoCardless");
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

		currentStep = "Update Donorfy with new GoCardless subscriber";
		const newSubscriberResult = await newGoCardlessSubscriber(
			goCardlessCustomer,
			extractedData,
			results
		);
		results.push({ step: currentStep, success: true });

		constituentId = newSubscriberResult.constituentId;

		return {
			message: `GoCardless customer ${customerId} subscription created. Successfully logged in Donorfy with constituent ID ${constituentId}`,
			status: 200,
			eventStatus: "processed",
			results,
			customerId,
			constituentId,
		};
	} catch (error) {
		error.results = error.results || results;
		error.goCardlessCustomerId =
			error.goCardlessCustomerId || customerId || null;
		error.constituentId = error.constituentId || constituentId || null;
		throw error;
	}
}
