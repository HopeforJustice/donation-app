// This file contains the main handler for Stripe webhook events in the donation app.
// It imports specific event handlers for different Stripe event types (e.g. checkout session completed, subscription, invoice).
// The handler checks for duplicate events using a processed_events table to ensure idempotency.
// Only events relevant to the donation app are processed; others are ignored or logged as unhandled.
// Each supported event type is routed to its corresponding handler function.

import { sql } from "@vercel/postgres";
import { handleCheckoutSessionCompleted } from "./handlers/checkoutSessionCompleted";
import { handleCheckoutSessionAsyncPaymentSucceeded } from "./handlers/checkoutSessionAsyncPaymentSucceeded";
import { handleSubscriptionCreated } from "./handlers/subscriptionCreated";
import { handleSubscriptionDeleted } from "./handlers/subscriptionDeleted";
import { handleSubscriptionUpdated } from "./handlers/subscriptionUpdated";
import { handleInvoicePaymentSucceeded } from "./handlers/invoicePaymentSucceeded";
import { handleInvoicePaymentFailed } from "./handlers/invoicePaymentFailed";

async function isDuplicateEvent(eventId) {
	const { rows } =
		await sql`SELECT 1 FROM processed_events WHERE event_id = ${eventId} LIMIT 1`;
	return rows.length > 0;
}

async function processEventAsync(event, stripeClient) {
	try {
		const eventId = event.id;

		// Check if we have already processed the event
		if (await isDuplicateEvent(eventId)) {
			console.log(`Duplicate webhook ignored: ${eventId}`);
			return;
		}

		let result;
		switch (event.type) {
			case "checkout.session.completed":
				result = await handleCheckoutSessionCompleted(event, stripeClient);
				break;

			case "checkout.session.async_payment_succeeded":
				result = await handleCheckoutSessionAsyncPaymentSucceeded(
					event,
					stripeClient
				);
				break;

			case "customer.subscription.created":
				result = await handleSubscriptionCreated(event, stripeClient);
				break;

			// No need for this at the moment
			// case "customer.subscription.updated":
			// 	result = await handleSubscriptionUpdated(event, stripeClient);
			//	break;

			case "invoice.payment_succeeded":
				result = await handleInvoicePaymentSucceeded(event, stripeClient);
				break;

			case "invoice.payment_failed":
				result = await handleInvoicePaymentFailed(event, stripeClient);
				break;

			case "customer.subscription.deleted":
				result = await handleSubscriptionDeleted(event, stripeClient);
				break;

			default:
				console.log(`Unhandled event type: ${event.type}`);
				return;
		}

		console.log(`Successfully processed ${event.type}:`, result);
	} catch (error) {
		console.error(`Error processing event ${event.id}:`, error);
		// You might want to implement retry logic or dead letter queue here
	}
}

export async function handleStripeWebhookEvent(event, stripeClient) {
	// Return 200 immediately to Stripe
	const response = {
		message: `Webhook received: ${event.id}`,
		status: 200,
		eventStatus: "received",
	};

	// Process the event asynchronously (don't await)
	processEventAsync(event, stripeClient);

	return response;
}
