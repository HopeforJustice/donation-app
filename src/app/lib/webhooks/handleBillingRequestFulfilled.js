import { sql } from "@vercel/postgres";
import { getGoCardlessClient } from "@/app/lib/gocardless/gocardlessclient";

const client = getGoCardlessClient();

export async function handleBillingRequestFulfilled(event) {
	const {
		billing_request: billingRequestId,
		mandate_request_mandate: mandateId,
		customer: gatewayCustomerId,
	} = event.links;

	try {
		// Find the billing request from the database
		const billingRequest = await sql`
			SELECT * FROM billing_requests
			WHERE billing_request_id = ${billingRequestId};
		`;

		if (billingRequest.rows.length === 0) {
			console.log("Billing Request not found in db");
			return { error: "Billing request not found", status: 200 };
		}

		const billingRequestData = billingRequest.rows[0];
		const subscriptionAmount = billingRequestData.amount;
		const collectionDay = billingRequestData.collection_day;
		const frequency = billingRequestData.frequency;
		const paymentGatewayId = billingRequestData.gateway_id;
		const customerId = billingRequestData.customer_id;

		// Update billing request to fulfilled
		await sql`
			UPDATE billing_requests
			SET status = 'fulfilled', updated_at = NOW()
			WHERE billing_request_id = ${billingRequestId};
		`;

		// Check and create the mandate if it doesn't exist
		const mandateResult = await sql`
			SELECT * FROM mandates WHERE mandate_id = ${mandateId};
		`;

		if (mandateResult.rows.length === 0) {
			await sql`
				INSERT INTO mandates (
				customer_id, gateway_id, mandate_id, status, created_at, updated_at
				) VALUES (
				${customerId}, ${paymentGatewayId}, ${mandateId}, 'active', NOW(), NOW()
				);
			`;
			console.log("Mandate created.");
		}

		// Check and create the payment gateway customer if not exists
		const gatewayCustomerResult = await sql`
			SELECT * FROM payment_gateway_customers
			WHERE gateway_customer_id = ${gatewayCustomerId} AND gateway_id = ${paymentGatewayId};
		`;

		if (gatewayCustomerResult.rows.length === 0) {
			await sql`
				INSERT INTO payment_gateway_customers (
				customer_id, gateway_id, gateway_customer_id, created_at, updated_at
				) VALUES (
				${customerId}, ${paymentGatewayId}, ${gatewayCustomerId}, NOW(), NOW()
				);
			`;
			console.log("Payment gateway customer created.");
		}

		// Create a subscription using the mandate and billing request details
		const subscription = await client.subscriptions.create({
			amount: subscriptionAmount * 100, // Amount in pence
			currency: "GBP",
			name: "Monthly Guardian",
			interval_unit: frequency, // e.g., "monthly"
			day_of_month: collectionDay,
			links: { mandate: mandateId },
		});

		if (subscription) {
			await sql`
				INSERT INTO subscriptions (
				customer_id, gateway_id, subscription_id, status, amount, frequency, collection_day, created_at, updated_at
				) VALUES (
				${customerId}, ${paymentGatewayId}, ${subscription.id}, 'active',
				${subscriptionAmount}, ${frequency}, ${collectionDay}, NOW(), NOW()
				);
			`;
		}

		return { message: "Subscription created", status: 200 };
	} catch (error) {
		return {
			message: "Error processing billing request fulfilled",
			error: error,
			status: 500,
		};
	}
}
