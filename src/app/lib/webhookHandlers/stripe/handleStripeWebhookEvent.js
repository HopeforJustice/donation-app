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
import storeWebhookEvent from "@/app/lib/db/storeWebhookEvent";

async function isEventAlreadyProcessed(eventId) {
	// Check if event is already in db
	const { rows } = await sql`
		SELECT status FROM processed_events 
		WHERE event_id = ${eventId} 
		LIMIT 1
	`;

	// If found and status not 'received', it's a duplicate
	if (rows.length > 0 && rows[0].status !== "received") {
		const status = rows[0].status;
		return { isDuplicate: true, status };
	}

	return { isDuplicate: false, status: null };
}

export async function handleStripeWebhookEvent(event, stripeClient) {
	const eventId = event.id;

	// Check if we have already processed or are currently processing the event
	const { isDuplicate, status } = await isEventAlreadyProcessed(eventId);
	if (isDuplicate) {
		console.log(`Duplicate webhook ignored: ${eventId} (status: ${status})`);
		return {
			message: `Duplicate webhook ignored: ${eventId}`,
			status: 200,
			eventStatus: "ignored",
		};
	}

	// Mark event as processing to prevent concurrent processing
	await storeWebhookEvent(
		event,
		"processing",
		"Started processing webhook event",
		null,
		null,
		null,
		null
	);

	switch (event.type) {
		case "checkout.session.completed":
			return await handleCheckoutSessionCompleted(event, stripeClient);

		case "checkout.session.async_payment_succeeded":
			return await handleCheckoutSessionAsyncPaymentSucceeded(
				event,
				stripeClient
			);

		case "customer.subscription.created":
			return await handleSubscriptionCreated(event, stripeClient);

		// No need for this at the moment
		// case "customer.subscription.updated":
		// 	return await handleSubscriptionUpdated(event, stripeClient);

		case "invoice.payment_succeeded":
			return await handleInvoicePaymentSucceeded(event, stripeClient);

		case "invoice.payment_failed":
			return await handleInvoicePaymentFailed(event, stripeClient);

		case "customer.subscription.deleted":
			return await handleSubscriptionDeleted(event, stripeClient);

		default:
			console.log(`Unhandled event type: ${event.type}`);
			return {
				message: `Unhandled event type: ${event.type}`,
				status: 200,
				eventStatus: "ignored",
			};
	}
}
