/*
 * handlePaymentFailed.js
 * Gocardless event for payments with failed status
 *
 * Check if the payment relates to a subscription
 * Get customer details with metadata from gocardless
 * Send GoCardless Payment Failed Avtivity to donorfy
 *
 */

import { getGoCardlessClient } from "@/app/lib/gocardless/gocardlessclient";
import { addActivity } from "../donorfy/addActivity";

const client = getGoCardlessClient();

export async function handlePaymentFailed(event) {
	try {
		const paymentId = event.links.payment;
		let notes = "";
		const payment = await client.payments.find(paymentId);
		const subscription = payment.links.subscription;
		const amount = payment.amount;
		const mandate = await client.mandates.find(payment.links.mandate);
		const customer = await client.customers.find(mandate.links.customer);
		const constituentId = customer.metadata.donorfyConstituentId;
		const friendlyAmount = amount / 100;
		const donorfyInstance = "uk";

		notes += "Payment and customer details found in Gocardless. ";

		// Only process payments that are part of a subscription
		// This can change if we take instant bank payments in the future
		if (subscription) {
			//Add Activity to Donorfy
			const activityData = {
				activityType: "Gocardless Payment Failed",
				notes: `Amount: ${friendlyAmount}`,
			};

			const addActivityData = await addActivity(
				activityData,
				constituentId,
				donorfyInstance
			);

			if (addActivityData.success) {
				notes += "Added Activity in Donorfy. ";
			} else {
				notes += "Activity creation failed in Donorfy. ";
				throw new Error(notes);
			}

			return {
				message: notes,
				status: 200,
				eventStatus: "processed",
			};
		} else {
			notes += "Payment not part of subscription";
			return {
				message: notes,
				status: 200,
				eventStatus: "N/A",
			};
		}
	} catch (error) {
		console.error("Error handling payment failed event:", error);
		return {
			message: "Error handling payment failed event",
			error,
			status: 500,
		};
	}
}
