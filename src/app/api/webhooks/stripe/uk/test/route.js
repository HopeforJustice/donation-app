import Stripe from "stripe";
import { handleStripeWebhookEvent } from "@/app/lib/webhooks/stripe/handleStripeWebhookEvent";

export const config = {
	api: {
		bodyParser: false,
	},
};

const stripe = new Stripe(process.env.STRIPE_UK_SECRET_KEY_TEST, {
	apiVersion: "2023-10-16",
});

export async function POST(req) {
	const rawBody = await req.text();
	const buffer = Buffer.from(rawBody);
	const sig = req.headers.get("stripe-signature");
	const webhookSecret = process.env.STRIPE_UK_WEBHOOK_SECRET_TEST;

	let event;

	try {
		event = stripe.webhooks.constructEvent(buffer, sig, webhookSecret);
	} catch (err) {
		console.error("Invalid signature:", err.message);
		return new Response(`Webhook Error: ${err.message}`, { status: 400 });
	}

	await handleStripeWebhookEvent(event, stripe, "uk", "test");

	return new Response(JSON.stringify({ received: true }), { status: 200 });
}
