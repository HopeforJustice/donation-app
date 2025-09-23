/**
 * handlePaymentFailed.js
 * Handles GoCardless webhook events for payments with a failed status.
 *
 * Steps:
 * 1. Initialize GoCardless and Donorfy clients.
 * 2. Retrieve payment details from GoCardless using the payment ID from the event.
 * 3. Extract the subscription, amount, and mandate information from the payment.
 * 4. Retrieve mandate details from GoCardless.
 * 5. Retrieve customer details from GoCardless, including Donorfy constituent ID from metadata.
 * 6. If the payment is part of a subscription (or in test mode), add a "GoCardless Payment Failed" activity in Donorfy.
 * 7. Return a success response with relevant IDs if processed, or a message if not part of a subscription.
 * 8. On error, log and throw with additional context.
 *
 * @param {Object} event - The GoCardless webhook event object.
 * @returns {Promise<Object>} Result of processing the payment failed event.
 * @throws {Error} If any step fails, throws an error with context.
 */

import { getGoCardlessClient } from "@/app/lib/gocardless/gocardlessclient";
import { getDonorfyClient } from "@/app/lib/utils";

const client = getGoCardlessClient();

export async function handlePaymentFailed(event) {
	const results = [];
	let currentStep = "";
	const test = process.env.VERCEL_ENV === "production" ? false : true;
	console.log("attempting to process payment failed");

	try {
		// Initialize Donorfy client (GoCardless is UK-only)
		const donorfy = getDonorfyClient("uk");

		const paymentId = event.links.payment;

		currentStep = "Retrieve payment details from GoCardless";
		const payment = await client.payments.find(paymentId);
		results.push({ step: currentStep, success: true });

		const subscription = payment.links.subscription;
		const amount = payment.amount;
		const friendlyAmount = amount / 100;

		currentStep = "Retrieve mandate details from GoCardless";
		const mandate = await client.mandates.find(payment.links.mandate);
		results.push({ step: currentStep, success: true });

		currentStep = "Retrieve customer details from GoCardless";
		const customer = await client.customers.find(mandate.links.customer);
		results.push({ step: currentStep, success: true });

		const constituentId = customer.metadata.donorfyConstituentId || null;

		// Only process payments that are part of a subscription
		// This can change if we take instant bank payments in the future
		if (subscription || test) {
			currentStep = "Add GoCardless Payment Failed Activity in Donorfy";

			await donorfy.addActivity({
				ActivityType: "Gocardless Payment Failed",
				Notes: `Amount: ${friendlyAmount}`,
				Number1: friendlyAmount,
				ExistingConstituentId: constituentId,
			});
			results.push({ step: currentStep, success: true });

			return {
				message: `Payment failed successfully noted in Donorfy for constituent ${constituentId}`,
				status: 200,
				eventStatus: "processed",
				customerId: customer.id,
				constituentId: constituentId,
			};
		} else {
			return {
				message: "Payment not part of subscription",
				status: 200,
				eventStatus: "N/A",
				results: results,
			};
		}
	} catch (error) {
		console.error(error);
		error.results = results;
		error.goCardlessCustomerId = customer.id;
		error.constituentId = constituentId || null;
		throw error;
	}
}
