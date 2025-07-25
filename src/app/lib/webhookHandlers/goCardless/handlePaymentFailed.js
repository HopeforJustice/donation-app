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
import { addActivity } from "../../donorfy/addActivity";

const client = getGoCardlessClient();

export async function handlePaymentFailed(event) {
	const results = [];
	let currentStep = "";

	try {
		const paymentId = event.links.payment;

		currentStep = "Retrieve payment details from GoCardless";
		const payment = await client.payments.find(paymentId);
		results.push({ step: currentStep, success: true });

		const subscription = payment.links.subscription;
		const amount = payment.amount;
		const friendlyAmount = amount / 100;

		currentStep = "Retrieve mandate details from GoCardless";
		const mandate = await client.mandates.find(payment.links.mandate);
		results.push({ step: currentStep, success: true });

		currentStep = "Retrieve customer details from GoCardless";
		const customer = await client.customers.find(mandate.links.customer);
		results.push({ step: currentStep, success: true });

		const constituentId = customer.metadata.donorfyConstituentId || null;
		const donorfyInstance = "uk";

		// Only process payments that are part of a subscription
		// This can change if we take instant bank payments in the future
		if (subscription) {
			currentStep = "Add GoCardless Payment Failed Activity in Donorfy";
			const activityData = {
				activityType: "Gocardless Payment Failed",
				notes: `Amount: ${friendlyAmount}`,
			};

			await addActivity(activityData, constituentId, donorfyInstance);
			results.push({ step: currentStep, success: true });

			return {
				message: `Payment failed successfully noted in Donorfy for constituent ${constituentId}`,
				status: 200,
				eventStatus: "processed",
			};
		} else {
			return {
				message: "Payment not part of subscription",
				status: 200,
				eventStatus: "N/A",
				results: results,
			};
		}
	} catch (error) {
		error.results = results;
		error.goCardlessCustomerId = customer.id;
		error.constituentId = constituentId || null;
		throw error;
	}
}
