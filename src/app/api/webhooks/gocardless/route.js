import { NextResponse } from "next/server";
import crypto from "crypto";
import { sql } from "@vercel/postgres";
const gocardless = require("gocardless-nodejs");
const constants = require("gocardless-nodejs/constants");

// Initialize GoCardless client
const client = gocardless(
	process.env.GOCARDLESS_ACCESS_TOKEN,
	constants.Environments.Sandbox // Use sandbox for testing; switch to live for production
);

export async function POST(req) {
	try {
		const webhookSecret = process.env.GOCARDLESS_WEBHOOK_SECRET; // Your webhook secret
		const rawBody = await req.text(); // Get raw body for signature validation
		const receivedSignature = req.headers.get("Webhook-Signature"); // Signature from GoCardless

		// Verify the signature
		const computedSignature = crypto
			.createHmac("sha256", webhookSecret)
			.update(rawBody)
			.digest("hex");

		if (receivedSignature !== computedSignature) {
			return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
		}

		const body = JSON.parse(rawBody);
		console.log("Webhook received:", body);

		// Check if the event is 'fulfilled' for billing_requests
		if (body.events && body.events.length > 0) {
			for (const event of body.events) {
				if (
					event.action === "fulfilled" &&
					event.resource_type === "billing_requests"
				) {
					const billingRequestId = event.links.billing_request;
					const customerId = event.links.customer;
					const mandateId = event.links.mandate_request_mandate;

					// Find the customer in the database using the customer ID from the webhook
					const result = await sql`
                        SELECT * FROM customers
                        WHERE gocardless_billing_request_id = ${billingRequestId};
                    `;

					if (result.rows.length === 0) {
						console.log("Customer not found");
						return NextResponse.json(
							{ error: "Customer not found" },
							{ status: 404 }
						);
					}

					const customer = result.rows[0];
					const subscriptionAmount = customer.donation_amount;
					const collectionDay = customer.collection_day;
					const frequency = customer.donation_frequency;

					// Step 2: Create a subscription using the mandate
					const subscription = await client.subscriptions.create({
						amount: subscriptionAmount * 100, // Amount in pence
						currency: "GBP", // Adjust currency based on your needs
						name: "Monthly Guardian",
						interval_unit: frequency, // e.g., "monthly", "weekly"
						day_of_month: collectionDay,
						links: {
							mandate: mandateId,
						},
					});

					console.log("Subscription created:", subscription);

					// Update the customer's status in the database
					await sql`
                        UPDATE customers
                        SET status = 'subscription_created', gocardless_mandate_id = ${mandateId}, gocardless_customer_id = ${customerId}
                        WHERE gocardless_billing_request_id = ${billingRequestId};
                    `;

					return NextResponse.json(
						{ subscriptionId: subscription.id },
						{ status: 200 }
					);
				}
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
