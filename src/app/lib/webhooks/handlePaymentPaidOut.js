/*
 * handlePaymentPaidOut.js
 * Gocardless event for payments with paid out status
 *
 * Check if the payment relates to a subscription
 * Get customer details with metadata from gocardless
 * Send payment details to donorfy
 *
 */

import { getGoCardlessClient } from "@/app/lib/gocardless/gocardlessclient";
import { createTransaction } from "../donorfy/createTransaction";

const client = getGoCardlessClient();

export async function handlePaymentPaidOut(event) {
	try {
		const paymentId = event.links.payment;
		let notes = "";
		const payment = await client.payments.find(paymentId);
		const subscription = payment.links.subscription;
		const amount = payment.amount;
		const mandate = await client.mandates.find(payment.links.mandate);
		const customer = await client.customers.find(mandate.links.customer);
		const additionalDetails = JSON.parse(customer.metadata.additionalDetails);
		const constituentId = customer.metadata.donorfyConstituentId;
		const campaign =
			additionalDetails.campaign || "Donation App General Campaign";
		const friendlyAmount = amount / 100;
		const product = "Donation";
		const fund = "Unrestricted";
		const channel = "Gocardless Subscription";
		const paymentMethod = "GoCardless DD";
		const donorfyInstance = "uk";
		const chargeDate = payment.created_at;

		notes += "Payment and customer details found in Gocardless. ";

		// Only process payments that are part of a subscription
		// This can change if we take instant bank payments in the future
		if (subscription) {
			await createTransaction(
				product,
				friendlyAmount,
				campaign,
				channel,
				paymentMethod,
				fund,
				constituentId,
				donorfyInstance,
				chargeDate
			);

			notes += "Transaction created in Donorfy. ";
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
		console.error("Error handling payment payout event:", error);
		return {
			message: "Error handling payment payout event",
			error,
			status: 500,
		};
	}
}
