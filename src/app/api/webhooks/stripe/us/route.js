import { handleStripeWebhookEvent } from "@/app/lib/webhookHandlers/stripe/handleStripeWebhookEvent";
import { getStripeInstance } from "@/app/lib/stripe/getStripeInstance";
import storeWebhookEvent from "@/app/lib/db/storeWebhookEvent";
import { stripMetadata } from "@/app/lib/utilities";

export const dynamic = "force-dynamic";
export const bodyParser = false;

const test = process.env.VERCEL_ENV !== "production";
const stripe = getStripeInstance({
	currency: "usd",
	mode: test ? "test" : "live",
});

let webhookSecret = test
	? process.env.STRIPE_UK_WEBHOOK_SECRET_TEST
	: process.env.STRIPE_UK_WEBHOOK_SECRET_LIVE;

export async function POST(req) {
	const rawBody = await req.text();
	const buffer = Buffer.from(rawBody);
	const sig = req.headers.get("stripe-signature");

	let event;

	try {
		event = stripe.webhooks.constructEvent(buffer, sig, webhookSecret);
	} catch (err) {
		console.error("Invalid signature:", err.message);
		return new Response(`Webhook Error: ${err.message}`, { status: 400 });
	}

	try {
		const webhookHandlerResponse = await handleStripeWebhookEvent(
			event,
			stripe
		);
		if (webhookHandlerResponse.eventStatus !== "ignored") {
			// need to store a different event type here
			await storeWebhookEvent(
				event,
				webhookHandlerResponse.eventStatus,
				JSON.stringify(webhookHandlerResponse.results || [], null, 2),
				webhookHandlerResponse.constituentId,
				null,
				webhookHandlerResponse.donorfyTransactionId
			);
		}
	} catch (error) {
		console.error("Error handling webhook event:", error);
		// Store the error in the database
		await storeWebhookEvent(
			await stripMetadata(event),
			"error",
			JSON.stringify(response.results || [], null, 2),
			error.constituentId || null,
			null,
			error.donorfyTransactionId || null
		);
		return new Response(`Webhook Error: ${error.message}`, { status: 500 });
	}

	return new Response(JSON.stringify({ received: true }), { status: 200 });
}
