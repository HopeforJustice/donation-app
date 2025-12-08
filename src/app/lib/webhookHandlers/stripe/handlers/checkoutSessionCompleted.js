/**
 * Handles Stripe Checkout Session Completed webhook events for one-off payments.
 *
 * This function processes a completed Stripe Checkout session by:
 * 1. Checking if the payment method is async (e.g. bank transfer)
 * 2. If async, skips processing and defers to checkout.session.async_payment_succeeded
 * 3. If not async, processes the donation via the shared helper function
 *
 * @async
 * @function handleCheckoutSessionCompleted
 * @param {object} event - The Stripe webhook event object.
 * @param {object} stripeClient - The initialized Stripe client instance.
 * @returns {Promise<object>} Result object containing processing status, results, constituentId, eventId, and Donorfy transaction ID.
 * @throws {Error} Throws error with processing step and context if any step fails.
 */

import { processCheckoutSessionDonation } from "../helpers/processCheckoutSessionDonation";

export async function handleCheckoutSessionCompleted(event, stripeClient) {
	const session = event.data.object;
	const results = [];

	try {
		// Check if this is an async payment method - if so, skip processing as checkout.session.async_payment_succeeded will handle it
		// Retrieve the actual payment method type used by the customer
		let paymentMethodType = null;
		let paymentIntent = null;

		if (session.payment_intent) {
			paymentIntent = await stripeClient.paymentIntents.retrieve(
				session.payment_intent
			);

			if (paymentIntent?.payment_method) {
				const paymentMethod = await stripeClient.paymentMethods.retrieve(
					paymentIntent.payment_method
				);
				paymentMethodType = paymentMethod.type;
			}
		}

		// Async payment methods ignored
		const asyncPaymentMethods = ["customer_balance", "pay_by_bank"];

		const isAsyncPaymentMethod =
			asyncPaymentMethods.includes(paymentMethodType) ||
			session.payment_status === "unpaid";

		if (isAsyncPaymentMethod) {
			console.log(
				`Skipping async payment checkout (method: ${paymentMethodType}, status: ${session.payment_status}) - will be handled by checkout.session.async_payment_succeeded event`
			);
			return {
				message:
					"Async payment checkout ignored - handled by checkout.session.async_payment_succeeded",
				status: 200,
				eventStatus: "skipped",
				results,
			};
		}

		// Process the donation using the shared helper
		return await processCheckoutSessionDonation(
			session,
			stripeClient,
			event.id,
			"Checkout Session Completed"
		);
	} catch (error) {
		if (!error.results) {
			results.push({ step: "Pre-processing check", success: false });
			error.results = results;
		}
		console.error("Error processing checkout session webhook:", error.results);
		error.eventId = event.id;
		throw error;
	}
}
