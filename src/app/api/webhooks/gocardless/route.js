import { NextResponse } from "next/server";
import crypto from "crypto";
import { handleBillingRequestFulfilled } from "@/app/lib/webhooks/handleBillingRequestFulfilled";
import { handlePaymentPaidOut } from "@/app/lib/webhooks/handlePaymentPaidOut";

export async function POST(req) {
	try {
		const webhookSecret = process.env.GOCARDLESS_WEBHOOK_SECRET_SANDBOX;
		const rawBody = await req.text();
		const receivedSignature = req.headers.get("Webhook-Signature");

		// Verify the signature
		const computedSignature = crypto
			.createHmac("sha256", webhookSecret)
			.update(rawBody)
			.digest("hex");
		if (receivedSignature !== computedSignature) {
			return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
		}

		const body = JSON.parse(rawBody);
		console.log("Webhook received:", JSON.stringify(body, null, 2));

		// Iterate over the events and handle them
		if (body.events && body.events.length > 0) {
			for (const event of body.events) {
				if (
					event.action === "fulfilled" &&
					event.resource_type === "billing_requests"
				) {
					const handleBillingRequestResponse =
						await handleBillingRequestFulfilled(event);
					return NextResponse.json(handleBillingRequestResponse, {
						status: handleBillingRequestResponse.status,
					});
				} else if (
					event.action === "paid_out" &&
					event.resource_type === "payments"
				) {
					const handlePaymentPaidOutResponse = await handlePaymentPaidOut(
						event
					);
					return NextResponse.json(handlePaymentPaidOutResponse, {
						status: handlePaymentPaidOutResponse.status,
					});
				}

				// Handle other webhooks
			}
		}

		return NextResponse.json({ message: "Event not handled" }, { status: 200 });
	} catch (error) {
		console.error("Error processing webhook:", error);
		return NextResponse.json(
			{ error: "Webhook processing failed" },
			{ status: 500 }
		);
	}
}
