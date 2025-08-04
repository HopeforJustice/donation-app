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
const client = getGoCardlessClient();
import DonorfyClient from "@/app/lib/donorfy/donorfyClient";
const donorfyUK = new DonorfyClient(
	process.env.DONORFY_UK_KEY,
	process.env.DONORFY_UK_TENANT
);

export async function handlePaymentFailed(event) {
	const results = [];
	let currentStep = "";
	const test = process.env.VERCEL_ENV === "production" ? false : true;
	console.log("attempting to process payment failed");

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

		// Only process payments that are part of a subscription
		// This can change if we take instant bank payments in the future
		if (subscription || test) {
			currentStep = "Add GoCardless Payment Failed Activity in Donorfy";

			await donorfyUK.addActivity({
				ActivityType: "Gocardless Payment Failed",
				Notes: `Amount: ${friendlyAmount}`,
				Number1: friendlyAmount,
				ExistingConstituentId: constituentId,
			});
			results.push({ step: currentStep, success: true });

			return {
				message: `Payment failed successfully noted in Donorfy for constituent ${constituentId}`,
				status: 200,
				eventStatus: "processed",
				customerId: customer.id,
				constituentId: constituentId,
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
		console.error(error);
		error.results = results;
		error.goCardlessCustomerId = customer.id;
		error.constituentId = constituentId || null;
		throw error;
	}
}
