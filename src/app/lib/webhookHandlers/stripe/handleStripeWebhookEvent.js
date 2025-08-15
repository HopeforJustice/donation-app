//handles stripe webhook events
//currently configured to only process if source is set to donation app

import { sql } from "@vercel/postgres";
import { handleCheckoutSessionCompleted } from "./handlers/checkoutSessionCompleted";
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

export async function handleStripeWebhookEvent(event, stripeClient) {
	const eventId = event.id;

	//check if we have already processed the event
	if (await isDuplicateEvent(eventId)) {
		console.log(`Duplicate webhook ignored: ${eventId}`);
		return {
			message: `Duplicate webhook ignored: ${eventId}`,
			status: 200,
			eventStatus: "ignored",
		};
	}

	switch (event.type) {
		case "checkout.session.completed":
			return await handleCheckoutSessionCompleted(event, stripeClient);

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
