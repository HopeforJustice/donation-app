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
 * Send seperate webhook to handle updating Donorfy (so this process can complete without relying on Donorfy's API)
 *
 */

import { getGoCardlessClient } from "@/app/lib/gocardless/gocardlessclient";
import storeWebhookEvent from "../db/storeWebhookEvent";
import addUpdateSubscriber from "../mailchimp/addUpdateSubscriber";
import addTag from "../mailchimp/addTag";
import sendDirectDebitConfirmationEmail from "../sparkpost/sendDirectDebitConfirmationEmail";

const client = getGoCardlessClient();

export async function handleBillingRequestFulfilled(event) {
	const {
		billing_request: billingRequestId,
		customer: customerId,
		mandate_request_mandate: mandateId,
	} = event.links;

	let notes = "";

	try {
		// Extract all details needed from GoCardless
		const billingRequest = await client.billingRequests.find(billingRequestId);
		const goCardlessCustomer = await client.customers.find(customerId);

		const extractedData = {
			additionalDetails: JSON.parse(billingRequest.metadata.additionalDetails),
			email: goCardlessCustomer.email,
			firstName: goCardlessCustomer.given_name,
			lastName: goCardlessCustomer.family_name,
			address1: goCardlessCustomer.address_line1,
			address2: goCardlessCustomer.address_line2,
			city: goCardlessCustomer.city,
			postalCode: goCardlessCustomer.postal_code,
		};

		console.log(extractedData);

		// Create a subscription if frequency is monthly
		if (extractedData.additionalDetails.frequency === "monthly") {
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
				notes += "Subscription created in GoCardless. ";
			} else {
				notes += "Failed to create subscription in GoCardless";
				throw new Error("Failed to create subscription in GoCardless");
			}
		}

		//Update customer metadata in GoCardless
		const updateCustomer = await client.customers.update(customerId, {
			metadata: {
				additionalDetails: billingRequest.metadata.additionalDetails,
			},
		});

		if (updateCustomer) {
			notes += "Customer Updated in GoCardless. ";
		} else {
			notes += "Failed to update Customer in GoCardless";
			throw new Error("Failed to update Customer in GoCardless");
		}
		/*
		 * If the constituent has said yes to email comms
		 * Add them to Mailchimp with an "GoCardless Active Subscription" tag
		 */

		if (extractedData.additionalDetails.preferences.email === "true") {
			// Add/update subscriber on Mailchimp
			await addUpdateSubscriber(
				extractedData.email,
				extractedData.firstName,
				extractedData.lastName,
				"subscribed",
				"uk"
			);

			notes += "Subscriber added/updated in Mailchimp. ";

			await addTag(extractedData.email, "GoCardless Active Subscription", "uk");

			notes += "Subscriber tags added. ";
		} else {
			notes += "Constituent said not to email, skipping mailchimp steps. ";
		}

		//Send confirmation email via Sparkpost
		const sendConfirmationEmailResponse =
			await sendDirectDebitConfirmationEmail(
				extractedData.email,
				extractedData.firstName,
				extractedData.additionalDetails.amount
			);

		if (sendConfirmationEmailResponse) {
			notes += "Confirmation email sent. ";
		} else {
			notes += "Failed to send confirmation email. ";
		}

		// add webhook here to process data into Donorfy

		await storeWebhookEvent(event, "completed", notes);

		return { message: "Billing request webhook processed", status: 200 };
	} catch (error) {
		console.error("Error processing billing request fulfilled", error);
		await storeWebhookEvent(
			event,
			"failed",
			`Error occurred: ${error.message} Notes: ${notes}`
		);
		return {
			message: "Error processing billing request fulfilled",
			error: error,
			status: 500,
		};
	}
}
