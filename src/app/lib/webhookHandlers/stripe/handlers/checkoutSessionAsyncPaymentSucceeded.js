/**
 * Handles Stripe Checkout Session Async Payment Succeeded webhook events for one-off payments.
 *
 * This function processes a completed async payment (e.g., bank transfers) from a Stripe Checkout session.
 * It uses the shared helper function to process the donation.
 *
 * @async
 * @function handleCheckoutSessionAsyncPaymentSucceeded
 * @param {object} event - The Stripe webhook event object.
 * @param {object} stripeClient - The initialized Stripe client instance.
 * @returns {Promise<object>} Result object containing processing status, results, constituentId, eventId, and Donorfy transaction ID.
 * @throws {Error} Throws error with processing step and context if any step fails.
 */

import { processCheckoutSessionDonation } from "../helpers/processCheckoutSessionDonation";

export async function handleCheckoutSessionAsyncPaymentSucceeded(
	event,
	stripeClient
) {
	const session = event.data.object;

	// Process the donation using the shared helper
	return await processCheckoutSessionDonation(
		session,
		stripeClient,
		event.id,
		"Checkout Session Async Payment Succeeded"
	);
}
