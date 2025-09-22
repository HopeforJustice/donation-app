/**
 * Handles the Stripe 'invoice.payment_failed' webhook event.
 *
 * Steps involved:
 * 1. Extract invoice data and retrieve the associated Stripe customer.
 * 2. Validate the webhook source using metadata (must be from 'donation-app').
 * 3. Ensure the invoice is related to a subscription.
 * 4. Initialize the Donorfy client based on the invoice currency.
 * 5. Find the corresponding constituent in Donorfy using the customer's email.
 * 6. Add a failed payment activity to the constituent's record in Donorfy.
 * 7. Return a summary of the processing result, or handle errors appropriately.
 *
 * @param {object} event - The Stripe webhook event object.
 * @param {object} stripeClient - The initialized Stripe client instance.
 * @returns {Promise<object>} Result object containing status, message, and processing details.
 * @throws {Error} If any step fails, throws an error with details and processing steps.
 */

import { getDonorfyClient } from "@/app/lib/utils";

export async function handleInvoicePaymentFailed(event, stripeClient) {
	const invoice = event.data.object;
	const results = [];
	let currentStep = "";
	let constituentId = null;
	const donorfyInstance = invoice.currency === "usd" ? "us" : "uk";

	try {
		currentStep = "Extract invoice data and retrieve customer";
		let customer = null;

		if (invoice.customer) {
			customer = await stripeClient.customers.retrieve(invoice.customer);
		}

		const metadata = customer?.metadata || invoice.metadata || {};
		const source = metadata.source || "unknown";
		results.push({ step: currentStep, success: true });

		// Validate source
		currentStep = "Validate webhook source";
		if (source !== "donation-app") {
			console.log(
				"Ignored failed payment webhook from unknown source:",
				source
			);
			return {
				message: `Failed payment webhook ignored - source: ${source}`,
				status: 200,
				eventStatus: "ignored",
				results,
			};
		}
		results.push({ step: currentStep, success: true });

		// Additional check: Only process subscription-related invoices
		currentStep = "Validate invoice is subscription-related";
		if (!invoice.subscription) {
			console.log("Ignored non-subscription failed payment:", invoice.id);
			return {
				message: `Non-subscription failed payment ignored: ${invoice.id}`,
				status: 200,
				eventStatus: "ignored",
				results,
			};
		}
		results.push({ step: currentStep, success: true });

		console.log(`Processing Stripe Invoice Payment Failed`);

		currentStep = "Initialize Donorfy client";
		const donorfy = getDonorfyClient(donorfyInstance);
		results.push({ step: currentStep, success: true });

		// Find constituent by email
		currentStep = "Find constituent in Donorfy";
		const duplicateCheckData = await donorfy.duplicateCheck({
			EmailAddress: customer?.email,
		});

		if (duplicateCheckData.length > 0 && duplicateCheckData[0].Score >= 15) {
			constituentId = duplicateCheckData[0].ConstituentId;
			results.push({ step: currentStep, success: true });
		} else {
			throw new Error(
				`No matching constituent found for email: ${customer?.email}`
			);
		}

		// Add failed payment activity
		currentStep = "Add failed payment activity";
		const failedPaymentActivityData = {
			ExistingConstituentId: constituentId,
			ActivityType: "Stripe Subscription Payment Failed",
			Notes: `Stripe Invoice ID: ${invoice.id}, Amount: ${(
				invoice.amount_due / 100
			).toFixed(2)} ${invoice.currency.toUpperCase()}, Failure: ${
				invoice.last_finalization_error?.message || "Unknown error"
			}`,
		};
		await donorfy.addActivity(failedPaymentActivityData);
		results.push({ step: currentStep, success: true });

		console.log(results);
		return {
			message: `Stripe payment failure recorded for constituent ${constituentId}`,
			status: 200,
			eventStatus: "processed",
			results,
			constituentId,
			eventId: event.id,
		};
	} catch (error) {
		results.push({ step: currentStep, success: false });
		console.error("Error processing failed payment webhook:", error);
		error.results = results;
		error.constituentId = constituentId || null;
		error.eventId = event.id;
		throw error;
	}
}
