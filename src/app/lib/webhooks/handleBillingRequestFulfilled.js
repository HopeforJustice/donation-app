import { sql } from "@vercel/postgres";
import { getGoCardlessClient } from "@/app/lib/gocardless/gocardlessclient";
import storeWebhookEvent from "./storeWebhookEvent";
import { addActiveTags } from "@/app/lib/donorfy/addActiveTags";
import { addActivity } from "@/app/lib/donorfy/addActivity";
import getConstituentIdFromCustomerID from "../db/getConsituentIdFromCustomerId";

const client = getGoCardlessClient();

export async function handleBillingRequestFulfilled(event) {
	const {
		billing_request: billingRequestId,
		mandate_request_mandate: mandateId,
		customer: gatewayCustomerId,
	} = event.links;

	let notes;

	try {
		// Find the billing request from the database
		const billingRequest = await sql`
			SELECT * FROM billing_requests
			WHERE billing_request_id = ${billingRequestId};
		`;

		// Dont continue if not found, store record of processed event
		if (billingRequest.rows.length === 0) {
			notes = "Billing Request not found in db";
			console.log(notes);
			await storeWebhookEvent(event, 1, notes);
			return { message: notes, status: 200 };
		}

		//Get data from billing request
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

		notes = "Billing Request marked as fulfilled in DB. ";

		// If the event has a mandateId store the mandate in the db
		if (mandateId) {
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
				notes += "Mandate created in DB. ";
			}
		}

		// if the event has a customerId store the gateway customer
		if (gatewayCustomerId) {
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
				notes += "Gateway customer created. ";
			}
		}

		//If the billing request was a monthly payment create a subscription
		if (frequency === "monthly") {
			const subscription = await client.subscriptions.create({
				amount: subscriptionAmount * 100, // Amount in pence
				currency: "GBP",
				name: "Monthly Guardian",
				interval_unit: frequency, // e.g., "monthly"
				day_of_month: collectionDay,
				links: { mandate: mandateId },
			});

			if (subscription) {
				const subscriptionRequest = await sql`
					INSERT INTO subscriptions (
					customer_id, gateway_id, subscription_id, status, amount, frequency, collection_day, created_at, updated_at
					) VALUES (
					${customerId}, ${paymentGatewayId}, ${subscription.id}, 'active',
					${subscriptionAmount}, ${frequency}, ${collectionDay}, NOW(), NOW()
					);
				`;

				if (subscriptionRequest) {
					console.log("subscription created");
					notes += "Subscription created in DB and GC. ";
				}

				//get constituent ID
				const constituentId = await getConstituentIdFromCustomerID(customerId);

				const tags = await addActiveTags(
					"Gocardless_Active Subscription",
					constituentId,
					"uk"
				);

				if (tags) {
					notes += "Tags added to constituent. ";
				}

				const activityData = {
					notes: "Gocardless Subscription created",
					activityType: "Gocardless Subscription",
				};

				const activity = await addActivity(activityData, constituentId, "uk");
				if (activity) {
					notes += "Activity added. ";
				}
			}
		}
		console.log(event, paymentGatewayId, notes);
		await storeWebhookEvent(event, paymentGatewayId, notes);

		return { message: "Billing request webhook processed", status: 200 };
	} catch (error) {
		return {
			message: "Error processing billing request fulfilled",
			error: error,
			status: 500,
		};
	}
}
