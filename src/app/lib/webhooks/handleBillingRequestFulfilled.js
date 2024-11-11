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
import { getConstituent } from "../donorfy/getConstituent";
import addUpdateSubscriber from "../mailchimp/addUpdateSubscriber";
import addTag from "../mailchimp/addTag";
import { getConstituentPreferences } from "../donorfy/getConstituentPreferences";
import { extractPreferences } from "../utilities";
import sendDirectDebitConfirmationEmail from "../sparkpost/sendDirectDebitConfirmationEmail";

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
		// Fetch the billing request from the database
		const billingRequest = await sql`
			SELECT * FROM billing_requests
			WHERE billing_request_id = ${billingRequestId};
		`;

		// Check if billing request does not exist

		/*
		 *  This is so we can mark the event as completed
		 *  and do nothing as the billing request did not
		 *  originate from the Donation app.
		 */
		if (billingRequest.rows.length === 0) {
			notes = "Billing Request not found in db";
			console.log(notes);
			await storeWebhookEvent(event, "database resource not found", 1, notes);
			// Return with message
			return { message: notes, status: 200 };
		}

		// Get data from billing request

		/*
		 * Continue if we have the billing request,
		 * Store information in variables
		 */
		const billingRequestData = billingRequest.rows[0];
		const billingRequestAmount = billingRequestData.amount;
		const collectionDay = billingRequestData.collection_day;
		const frequency = billingRequestData.frequency;
		paymentGatewayId = billingRequestData.gateway_id;
		const customerId = billingRequestData.customer_id;
		const campaign = billingRequestData.campaign;
		const constituentId = await getConstituentIdFromCustomerID(customerId);

		// Update billing request to fulfilled in db
		await sql`
			UPDATE billing_requests
			SET status = 'fulfilled', updated_at = NOW()
			WHERE billing_request_id = ${billingRequestId};
		`;

		notes = "Billing Request marked as fulfilled in DB. ";

		// Check and store the mandate if it doesn't exist
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

		// Check and store the payment gateway customer if it doesn't already exist
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

		// Create a subscription if frequency is monthly
		if (frequency === "monthly") {
			const subscription = await client.subscriptions.create({
				amount: billingRequestAmount * 100,
				currency: "GBP",
				name: "Monthly Guardian",
				interval_unit: frequency,
				day_of_month: collectionDay,
				links: { mandate: mandateId },
			});

			if (subscription) {
				await sql`
					INSERT INTO subscriptions (
					customer_id, gateway_id, subscription_id, status, amount, frequency, collection_day, created_at, updated_at, campaign
					) VALUES (
					${customerId}, ${paymentGatewayId}, ${subscription.id}, 'active',
					${billingRequestAmount}, ${frequency}, ${collectionDay}, NOW(), NOW(), ${campaign}
					);
				`;
				console.log("Subscription created in DB and GC.");
				notes += "Subscription created in DB and GC. ";

				// Add active tags and activity
				await addActiveTags(
					"Gocardless_Active Subscription",
					constituentId,
					"uk"
				);
				notes += "Tags added to constituent. ";

				const activityData = {
					notes: `Gocardless Subscription created. Amount: ${billingRequestAmount}`,
					activityType: "Gocardless Subscription",
				};

				await addActivity(activityData, constituentId, "uk");
				notes += "Activity added. ";
			}
		} else {
			/* Handle billing request for one off payments in the future */
		}

		/*
		 * If the constituent has said yes to email comms
		 * Add them to Mailchimp with an active subscription tag
		 */

		// Get the donorfy constituent
		const constituent = await getConstituent(constituentId, "uk");

		// Get the constiuent's preferences
		const constituentPreferences = await getConstituentPreferences(
			constituentId,
			"uk"
		);

		const extractedPreferences = await extractPreferences(
			constituentPreferences
		);

		if (extractedPreferences.emailPreference) {
			// Add/update subscriber on Mailchimp
			await addUpdateSubscriber(
				constituent.constituentData.EmailAddress,
				constituent.constituentData.FirstName,
				constituent.constituentData.LastName,
				"subscribed",
				"uk"
			);

			notes += "Subscriber added/updated in Mailchimp. ";

			await addTag(
				constituent.constituentData.EmailAddress,
				"Gocardless Active Subscription",
				"uk"
			);

			notes += "Subscriber tags added. ";

			console.log(event, paymentGatewayId, notes);
		} else {
			notes += "Constituent said not to email, skipping mailchimp steps. ";
		}

		//Send confirmation email via Sparkpost
		const sendConfirmationEmailResponse =
			await sendDirectDebitConfirmationEmail(
				constituent.constituentData.EmailAddress,
				constituent.constituentData.FirstName,
				billingRequestAmount
			);

		if (sendConfirmationEmailResponse) {
			notes += "Confirmation email sent. ";
		} else {
			notes += "Failed to send confirmation email. ";
		}

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
