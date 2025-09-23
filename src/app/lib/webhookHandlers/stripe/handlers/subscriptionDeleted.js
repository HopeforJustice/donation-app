/**
 * Handles the Stripe subscription.deleted webhook event.
 *
 * Steps performed:
 * 1. Extracts and validates subscription data from the event.
 * 2. Retrieves the associated Stripe customer.
 * 3. Extracts metadata to determine the source of the webhook.
 * 4. Validates that the webhook originated from the expected source ("donation-app").
 * 5. Initializes the Donorfy client based on the subscription currency.
 * 6. Attempts to find the corresponding constituent in Donorfy using the customer's email.
 * 7. If a matching constituent is found, records a "Stripe Subscription Cancelled" activity in Donorfy.
 * 8. Returns a summary of the processing steps and results.
 * 9. Handles and logs errors, attaching step results and relevant IDs for debugging.
 *
 * @async
 * @param {object} event - The Stripe webhook event object.
 * @param {object} stripeClient - The initialized Stripe client instance.
 * @returns {Promise<object>} An object containing the processing message, status, event status, results, constituentId, and eventId.
 * @throws {Error} If any step fails, throws an error with additional context and step results.
 */

import { getDonorfyClient } from "@/app/lib/utils";

export async function handleSubscriptionDeleted(event, stripeClient) {
	const subscription = event.data.object;
	const results = [];
	let currentStep = "";
	let constituentId = null;
	let donorfyInstance;

	try {
		// Extract and validate subscription data
		currentStep = "Extract subscription data and retrieve customer";
		let customer = null;
		if (subscription.customer) {
			customer = await stripeClient.customers.retrieve(subscription.customer);
		}

		// Get metadata from subscription or customer
		const metadata = subscription.metadata || customer?.metadata || {};
		const source = metadata.source || "unknown";
		results.push({ step: currentStep, success: true });

		// Validate source
		currentStep = "Validate webhook source";
		if (source !== "donation-app") {
			console.log(
				"Ignored subscription cancellation webhook from unknown source:",
				source
			);
			return {
				message: `Subscription cancellation webhook ignored - source: ${source}`,
				status: 200,
				eventStatus: "ignored",
				results,
			};
		}
		results.push({ step: currentStep, success: true });

		console.log(`Processing Stripe Subscription Cancelled/Deleted`);

		currentStep = "Initialize Donorfy client";
		donorfyInstance = subscription.currency === "usd" ? "us" : "uk";
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

		// Add subscription cancellation activity
		currentStep = "Add subscription cancellation activity";

		const cancellationActivityData = {
			ExistingConstituentId: constituentId,
			ActivityType: "Stripe Subscription Cancelled",
			Notes: `Stripe Subscription ID: ${subscription.id}`,
			Number1: subscription.amount / 100,
		};
		await donorfy.addActivity(cancellationActivityData);
		results.push({ step: currentStep, success: true });

		console.log(results);
		return {
			message: `Stripe subscription cancellation recorded for constituent ${constituentId}`,
			status: 200,
			eventStatus: "processed",
			results,
			constituentId,
			eventId: event.id,
		};
	} catch (error) {
		results.push({ step: currentStep, success: false });
		console.error("Error processing subscription cancellation webhook:", error);
		error.results = results;
		error.constituentId = constituentId || null;
		error.eventId = event.id;
		throw error;
	}
}
