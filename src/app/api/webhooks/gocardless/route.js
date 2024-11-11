import { NextResponse } from "next/server";
import crypto from "crypto";
import { handleBillingRequestFulfilled } from "@/app/lib/webhooks/handleBillingRequestFulfilled";
import { handlePaymentPaidOut } from "@/app/lib/webhooks/handlePaymentPaidOut";
import checkProcessedEvents from "@/app/lib/db/checkProcessedEvents";
import storeWebhookEvent from "@/app/lib/db/storeWebhookEvent";
import { handlePaymentFailed } from "@/app/lib/webhooks/handlePaymentFailed";
import { handleSubscriptionCancelled } from "@/app/lib/webhooks/handleSubscriptionCancelled";
import sendErrorEmail from "@/app/lib/sparkpost/sendErrorEmail";

const eventHandlers = {
	"billing_requests:fulfilled": handleBillingRequestFulfilled,
	"payments:paid_out": handlePaymentPaidOut,
	"payments:failed": handlePaymentFailed,
	"subscriptions:cancelled": handleSubscriptionCancelled,
};

export async function POST(req) {
	// const webhookSecret = process.env.GOCARDLESS_WEBHOOK_SECRET_SANDBOX;
	let body;

	try {
		const rawBody = await req.text();
		const receivedSignature = req.headers.get("Webhook-Signature");
		console.log(receivedSignature);
		// const computedSignature = crypto
		// 	.createHmac("sha256", webhookSecret)
		// 	.update(rawBody)
		// 	.digest("hex");

		body = JSON.parse(rawBody);

		// if (receivedSignature !== computedSignature) {
		// 	await storeWebhookEvent(body, "failed", 1, "Invalid signature");
		// 	return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
		// }

		console.log("webhook recieved: ", JSON.stringify(body, null, 2));

		for (const event of body.events) {
			const hasBeenProcessed = await checkProcessedEvents(event.id);

			if (!hasBeenProcessed) {
				const eventKey = `${event.resource_type}:${event.action}`;
				const handler = eventHandlers[eventKey];

				if (handler) {
					try {
						const response = await handler(event);
						if (response.eventStatus && response.message) {
							await storeWebhookEvent(
								event,
								response.eventStatus,
								1,
								response.message
							);
						}

						return NextResponse.json(response, { status: response.status });
					} catch (error) {
						console.error("Error handling event:", error);
						await storeWebhookEvent(event, "failed", 1, error.message);

						// Send error email
						await sendErrorEmail(error, {
							name: "Gocardless webhook event failed to process",
							event: event,
						});
					}
				} else {
					console.log("No handler for event:", eventKey);
				}
			}
		}

		return NextResponse.json(
			{
				message: "All events either successfully processed or skipped",
			},
			{ status: 200 }
		);
	} catch (error) {
		console.error("Error processing webhook:", error);
		await storeWebhookEvent(body || {}, "failed", 1, error.message);
		return NextResponse.json(
			{ error: "Webhook processing failed" },
			{ status: 500 }
		);
	}
}
