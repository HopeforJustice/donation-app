import { handleStripeWebhookEvent } from "@/app/lib/webhookHandlers/stripe/handleStripeWebhookEvent";
import { getStripeInstance } from "@/app/lib/stripe/getStripeInstance";
import storeWebhookEvent from "@/app/lib/db/storeWebhookEvent";
import { stripMetadata } from "@/app/lib/utilities";

export const dynamic = "force-dynamic";
export const bodyParser = false;

const test = process.env.VERCEL_ENV !== "production";

// Helper function to get webhook secret based on currency and mode
function getWebhookSecret(currency, isTestMode) {
	// Map currency codes to your existing environment variable naming
	const currencyToRegion = {
		USD: "US",
		GBP: "UK",
	};

	const region = currencyToRegion[currency.toUpperCase()] || "US"; // default to US
	const mode = isTestMode ? "TEST" : "LIVE";
	const secretKey = `STRIPE_${region}_WEBHOOK_SECRET_${mode}`;
	return process.env[secretKey];
}

// Helper function to determine currency and mode from webhook data
function parseWebhookMetadata(rawBody) {
	try {
		const eventData = JSON.parse(rawBody);

		if (!eventData.data?.object) {
			throw new Error("Webhook missing data.object");
		}

		const dataObject = eventData.data.object;

		if (!dataObject.currency) {
			throw new Error("Webhook missing currency information");
		}

		if (typeof eventData.livemode !== "boolean") {
			throw new Error("Webhook missing livemode information");
		}

		return {
			currency: dataObject.currency,
			isTestMode: !eventData.livemode,
		};
	} catch (error) {
		console.error("Failed to parse webhook metadata:", error);
		throw error; // rethrow to handle in the main function
	}
}

export async function POST(req) {
	try {
		const rawBody = await req.text();
		const buffer = Buffer.from(rawBody);
		const sig = req.headers.get("stripe-signature");

		// Parse webhook metadata to determine currency and mode
		const { currency, isTestMode } = parseWebhookMetadata(rawBody);
		console.log(
			`Webhook detected: currency=${currency}, testMode=${isTestMode}`
		);

		// Get the appropriate Stripe instance and webhook secret
		const stripe = getStripeInstance({
			currency: currency.toLowerCase(),
			mode: isTestMode ? "test" : "live",
		});

		const webhookSecret = getWebhookSecret(currency, isTestMode);

		if (!webhookSecret) {
			console.error(
				`No webhook secret found for ${currency} in ${
					isTestMode ? "test" : "live"
				} mode`
			);
			return new Response(
				`Webhook Error: No webhook secret configured for ${currency}`,
				{ status: 400 }
			);
		}

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
				JSON.stringify(error.results || [], null, 2),
				error.constituentId || null,
				null,
				error.donorfyTransactionId || null
			);
			return new Response(`Webhook Error: ${error.message}`, { status: 500 });
		}

		return new Response(JSON.stringify({ received: true }), { status: 200 });
	} catch (error) {
		console.error("Error processing webhook:", error);
		return new Response(`Webhook Error: ${error.message}`, { status: 500 });
	}
}
