/*
 * handlePaymentPaidOut.js
 * Gocardless event for billing request fulfilled
 *
 */

import { sql } from "@vercel/postgres";
import { getGoCardlessClient } from "@/app/lib/gocardless/gocardlessclient";
import storeWebhookEvent from "../db/storeWebhookEvent";
import { addActiveTags } from "@/app/lib/donorfy/addActiveTags";
import { addActivity } from "@/app/lib/donorfy/addActivity";
import getConstituentIdFromCustomerID from "../db/getConsituentIdFromCustomerId";
import pRetry from "p-retry";
import { getConstituent } from "../donorfy/getConstituent";
import addUpdateSubscriber from "../mailchimp/addUpdateSubscriber";
import addTag from "../mailchimp/addTag";

const client = getGoCardlessClient();

export async function handleBillingRequestFulfilled(event) {
	const {
		billing_request: billingRequestId,
		mandate_request_mandate: mandateId,
		customer: gatewayCustomerId,
	} = event.links;

	let notes = "";
	let paymentGatewayId = 1;

	try {
		// Retry fetching the billing request from the database
		const billingRequest = await pRetry(
			() => sql`
				SELECT * FROM billing_requests
				WHERE billing_request_id = ${billingRequestId};
				`,
			{
				retries: 3,
				onFailedAttempt: (error) => {
					console.error(
						`Attempt ${error.attemptNumber} failed. There are ${error.retriesLeft} retries left for fetching billing request.`
					);
				},
			}
		);

		// Don't continue if not found, store record of processed event
		// This is to handle billing requests that have not originated from the donation app
		if (billingRequest.rows.length === 0) {
			notes = "Billing Request not found in db";
			console.log(notes);
			await storeWebhookEvent(event, "database resource not found", 1, notes);
			return { message: notes, status: 200 };
		}

		// Get data from billing request
		const billingRequestData = billingRequest.rows[0];
		const subscriptionAmount = billingRequestData.amount;
		const collectionDay = billingRequestData.collection_day;
		const frequency = billingRequestData.frequency;
		paymentGatewayId = billingRequestData.gateway_id;
		const customerId = billingRequestData.customer_id;
		const campaign = billingRequestData.campaign;
		const constituentId = await getConstituentIdFromCustomerID(customerId);

		// Retry updating billing request to fulfilled
		await pRetry(
			() => sql`
				UPDATE billing_requests
				SET status = 'fulfilled', updated_at = NOW()
				WHERE billing_request_id = ${billingRequestId};
				`,
			{
				retries: 3,
				onFailedAttempt: (error) => {
					console.error(
						`Attempt ${error.attemptNumber} failed. There are ${error.retriesLeft} retries left for updating billing request.`
					);
				},
			}
		);

		notes = "Billing Request marked as fulfilled in DB. ";

		// Retry checking and storing the mandate if it doesn't exist
		if (mandateId) {
			const mandateResult = await pRetry(
				() => sql`
					SELECT * FROM mandates WHERE mandate_id = ${mandateId};
				`,
				{
					retries: 3,
					onFailedAttempt: (error) => {
						console.error(
							`Attempt ${error.attemptNumber} failed. There are ${error.retriesLeft} retries left for fetching mandate.`
						);
					},
				}
			);

			if (mandateResult.rows.length === 0) {
				await pRetry(
					() => sql`
						INSERT INTO mandates (
						customer_id, gateway_id, mandate_id, status, created_at, updated_at
						) VALUES (
						${customerId}, ${paymentGatewayId}, ${mandateId}, 'active', NOW(), NOW()
						);
						`,
					{
						retries: 3,
						onFailedAttempt: (error) => {
							console.error(
								`Attempt ${error.attemptNumber} failed. There are ${error.retriesLeft} retries left for inserting mandate.`
							);
						},
					}
				);
				console.log("Mandate created.");
				notes += "Mandate created in DB. ";
			}
		}

		// Retry checking and storing the payment gateway customer if not exists
		if (gatewayCustomerId) {
			const gatewayCustomerResult = await pRetry(
				() => sql`
					SELECT * FROM payment_gateway_customers
					WHERE gateway_customer_id = ${gatewayCustomerId} AND gateway_id = ${paymentGatewayId};
				`,
				{
					retries: 3,
					onFailedAttempt: (error) => {
						console.error(
							`Attempt ${error.attemptNumber} failed. There are ${error.retriesLeft} retries left for fetching gateway customer.`
						);
					},
				}
			);

			if (gatewayCustomerResult.rows.length === 0) {
				await pRetry(
					() => sql`
						INSERT INTO payment_gateway_customers (
						customer_id, gateway_id, gateway_customer_id, created_at, updated_at
						) VALUES (
						${customerId}, ${paymentGatewayId}, ${gatewayCustomerId}, NOW(), NOW()
						);
						`,
					{
						retries: 3,
						onFailedAttempt: (error) => {
							console.error(
								`Attempt ${error.attemptNumber} failed. There are ${error.retriesLeft} retries left for inserting gateway customer.`
							);
						},
					}
				);
				console.log("Payment gateway customer created.");
				notes += "Gateway customer created. ";
			}
		}

		// Retry creating a subscription using the mandate and billing request details
		if (frequency === "monthly") {
			const subscription = await pRetry(
				() =>
					client.subscriptions.create({
						amount: subscriptionAmount * 100, // Amount in pence
						currency: "GBP",
						name: "Monthly Guardian",
						interval_unit: frequency, // e.g., "monthly"
						day_of_month: collectionDay,
						links: { mandate: mandateId },
					}),
				{
					retries: 3,
					onFailedAttempt: (error) => {
						console.error(
							`Attempt ${error.attemptNumber} failed. There are ${error.retriesLeft} retries left for creating subscription.`
						);
					},
				}
			);

			if (subscription) {
				await pRetry(
					() => sql`
						INSERT INTO subscriptions (
						customer_id, gateway_id, subscription_id, status, amount, frequency, collection_day, created_at, updated_at, campaign
						) VALUES (
						${customerId}, ${paymentGatewayId}, ${subscription.id}, 'active',
						${subscriptionAmount}, ${frequency}, ${collectionDay}, NOW(), NOW(), ${campaign}
						);
						`,
					{
						retries: 3,
						onFailedAttempt: (error) => {
							console.error(
								`Attempt ${error.attemptNumber} failed. There are ${error.retriesLeft} retries left for inserting subscription.`
							);
						},
					}
				);
				console.log("Subscription created in DB and GC.");
				notes += "Subscription created in DB and GC. ";

				// Retry adding active tags and activity

				const tags = await pRetry(
					() =>
						addActiveTags(
							"Gocardless_Active Subscription",
							constituentId,
							"uk"
						),
					{
						retries: 3,
						onFailedAttempt: (error) => {
							console.error(
								`Attempt ${error.attemptNumber} failed. There are ${error.retriesLeft} retries left for adding tags.`
							);
						},
					}
				);

				if (tags) {
					notes += "Tags added to constituent. ";
				}

				const activityData = {
					notes: `Gocardless Subscription created. Amount: ${subscriptionAmount}`,
					activityType: "Gocardless Subscription",
				};

				const activity = await pRetry(
					() => addActivity(activityData, constituentId, "uk"),
					{
						retries: 3,
						onFailedAttempt: (error) => {
							console.error(
								`Attempt ${error.attemptNumber} failed. There are ${error.retriesLeft} retries left for adding activity.`
							);
						},
					}
				);

				if (activity) {
					notes += "Activity added. ";
				}
			}
		}

		// Retry adding adding/updating subscriber on mailchimp

		// Ask Donorfy for donor details
		const constituent = await getConstituent(constituentId, "uk");

		await pRetry(
			() =>
				addUpdateSubscriber(
					constituent.constituentData.EmailAddress,
					constituent.constituentData.FirstName,
					constituent.constituentData.LastName,
					"subscribed",
					"uk"
				),
			{
				retries: 3,
				onFailedAttempt: (error) => {
					console.error(
						`Attempt ${error.attemptNumber} failed. There are ${error.retriesLeft} retries left for adding/updating subscriber.`
					);
				},
			}
		);

		notes += "Subscriber added/updated in mailchimp. ";

		await pRetry(
			() =>
				addTag(
					constituent.constituentData.EmailAddress,
					"Gocardless Active Subscription",
					"uk"
				),
			{
				retries: 3,
				onFailedAttempt: (error) => {
					console.error(
						`Attempt ${error.attemptNumber} failed. There are ${error.retriesLeft} retries left for adding/updating subscriber.`
					);
				},
			}
		);

		notes += "Subscriber tags added. ";

		console.log(event, paymentGatewayId, notes);
		await storeWebhookEvent(event, "completed", paymentGatewayId, notes);

		return { message: "Billing request webhook processed", status: 200 };
	} catch (error) {
		console.error("Error processing billing request fulfilled", error);
		await storeWebhookEvent(
			event,
			"failed",
			paymentGatewayId,
			`Error occurred: ${error.message} Notes: ${notes}`
		);
		return {
			message: "Error processing billing request fulfilled",
			error: error,
			status: 500,
		};
	}
}
