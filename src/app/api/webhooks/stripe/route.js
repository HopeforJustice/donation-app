import { handleStripeWebhookEvent } from "@/app/lib/webhookHandlers/stripe/handleStripeWebhookEvent";
import { getStripeInstance } from "@/app/lib/stripe/getStripeInstance";
import storeWebhookEvent from "@/app/lib/db/storeWebhookEvent";
import { stripMetadata } from "@/app/lib/utilities";
import sendErrorEmail from "@/app/lib/sparkpost/sendErrorEmail";
<<<<<<< Updated upstream
export const dynamic = "force-dynamic"; // stops next/vercel from caching the response
=======
import { waitUntil } from "@vercel/functions";
export const dynamic = "force-dynamic";
>>>>>>> Stashed changes
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
			return {
				currency: null,
				isTestMode: null,
			};
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

// Async function to handle webhook processing without blocking the response
async function processWebhookAsync(rawBody, sig) {
	try {
		const buffer = Buffer.from(rawBody);

		// "customer.subscription.updated" not currently in use
		const acceptedEvents = [
			"checkout.session.completed",
			"invoice.payment_failed",
			"invoice.payment_succeeded",
			"checkout.session.async_payment_succeeded",
			"customer.subscription.created",
			"customer.subscription.deleted",
		];

		// Parse webhook metadata to determine currency and mode
		const { currency, isTestMode } = parseWebhookMetadata(rawBody);
		console.log(
			`Webhook detected: currency=${currency}, testMode=${isTestMode}`
		);

		if (!currency) {
			console.log("Unhandled webhook, no currency");
			return;
		}

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
			return;
		}

		let event;

		try {
			event = stripe.webhooks.constructEvent(buffer, sig, webhookSecret);
		} catch (err) {
			console.error("Invalid signature:", err.message);
			return;
		}

		if (!acceptedEvents.includes(event.type)) {
			console.log(`Ignored unhandled event type: ${event.type}`);
			return new Response(`Unhandled event type: ${event.type}`, {
				status: 200,
			});
		}

		// Store event as 'received' immediately to create deduplication lock
		await storeWebhookEvent(
			event,
			"received",
			"Webhook received and validated",
			null,
			null,
			null,
			null
		);

		// Process webhook asynchronously while returning 200 OK immediately to Stripe
		const processingPromise = (async () => {
			try {
				const webhookHandlerResponse = await handleStripeWebhookEvent(
					event,
					stripe
				);
				if (webhookHandlerResponse.eventStatus !== "ignored") {
					// Extract subscription ID from various event types
					let subscriptionId = null;
					if (event.data?.object) {
						const dataObject = event.data.object;
						// Direct subscription events
						if (dataObject.object === "subscription") {
							subscriptionId = dataObject.id;
						}
						// Invoice events - get subscription from invoice
						else if (
							dataObject.object === "invoice" &&
							dataObject.subscription
						) {
							subscriptionId = dataObject.subscription;
						}
						// Subscription from webhook response
						else if (webhookHandlerResponse.subscriptionId) {
							subscriptionId = webhookHandlerResponse.subscriptionId;
						}
					}

					await storeWebhookEvent(
						event,
						webhookHandlerResponse.eventStatus,
						JSON.stringify(webhookHandlerResponse.results || [], null, 2),
						webhookHandlerResponse.constituentId,
						null,
						webhookHandlerResponse.donorfyTransactionId,
						subscriptionId
					);
				}
			} catch (error) {
				console.error("Error handling webhook event:", error);

				// Extract subscription ID for error cases too
				let subscriptionId = null;
				if (event.data?.object) {
					const dataObject = event.data.object;
					if (dataObject.object === "subscription") {
						subscriptionId = dataObject.id;
					} else if (
						dataObject.object === "invoice" &&
						dataObject.subscription
					) {
						subscriptionId = dataObject.subscription;
					}
				}

				// Store the error in the database
				await storeWebhookEvent(
					await stripMetadata(event),
					"error",
					JSON.stringify(error.results || [], null, 2),
					error.constituentId || null,
					null,
					error.donorfyTransactionId || null,
					subscriptionId
				);
				await sendErrorEmail(error, {
					name: "Stripe webhook failed to process",
					event: {
						results: JSON.stringify(error.results || [], null, 2),
						error: error.message,
					},
				});
			}
		})();

<<<<<<< Updated upstream
			// Extract subscription ID for error cases too
			let subscriptionId = null;
			if (event.data?.object) {
				const dataObject = event.data.object;
				if (dataObject.object === "subscription") {
					subscriptionId = dataObject.id;
				} else if (dataObject.object === "invoice" && dataObject.subscription) {
					subscriptionId = dataObject.subscription;
				}
			}

			// Store the error in the database
			await storeWebhookEvent(
				await stripMetadata(event),
				"error",
				JSON.stringify(error.results || [], null, 2),
				error.constituentId || null,
				null,
				error.donorfyTransactionId || null,
				subscriptionId
			);
			await sendErrorEmail(
				error,
				{
					name: "Stripe webhook failed to process",
					event: {
						results: JSON.stringify(error.results || [], null, 2),
						error: error.message,
						id: event.id || "unknown",
					},
				},
				test
			);
		}
	} catch (error) {
		console.error("Error processing webhook:", error);
		await sendErrorEmail(
			error,
			{
				name: "Stripe webhook failed to process",
				event: {
					results: JSON.stringify(error.results || [], null, 2),
					error: error.message,
					id: event.id || "unknown",
				},
			},
			test
		);
	}
}

export async function POST(req) {
	try {
		const rawBody = await req.text();
		const sig = req.headers.get("stripe-signature");

		// Basic validation before returning 200
		if (!sig) {
			console.error("Missing stripe-signature header");
			return new Response("Missing stripe-signature header", { status: 400 });
		}

		// Return 200 immediately to acknowledge receipt to Stripe
		const response = new Response(JSON.stringify({ received: true }), {
			status: 200,
			headers: {
				"Content-Type": "application/json",
=======
		// Use waitUntil to process in background without blocking response
		waitUntil(processingPromise);

		// Return 200 OK immediately to Stripe
		return new Response(JSON.stringify({ received: true }), { status: 200 });
	} catch (error) {
		console.error("Error processing webhook:", error);
		await sendErrorEmail(error, {
			name: "Stripe webhook failed to process",
			event: {
				results: JSON.stringify(error.results || [], null, 2),
				error: error.message,
>>>>>>> Stashed changes
			},
		});

		// Process webhook asynchronously without blocking the response
		setImmediate(() => {
			processWebhookAsync(rawBody, sig).catch((error) => {
				console.error("Async webhook processing failed:", error);
			});
		});

		return response;
	} catch (error) {
		console.error("Error processing webhook request:", error);
		return new Response(`Webhook Error: ${error.message}`, { status: 500 });
	}
}
