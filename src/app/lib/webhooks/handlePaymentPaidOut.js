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

		// Ensure payment exists before accessing links
		const payment = await client.payments.find(paymentId);
		if (!payment || !payment.links) {
			throw new Error("Payment or payment.links is undefined");
		}

		const subscription = payment.links.subscription || null; // Ensure it is either a value or null
		const amount = payment.amount;

		// Ensure mandate and customer exist before accessing metadata
		if (!payment.links.mandate) {
			throw new Error("Payment is missing a mandate link");
		}

		const mandate = await client.mandates.find(payment.links.mandate);
		if (!mandate || !mandate.links || !mandate.links.customer) {
			throw new Error("Mandate is missing customer link");
		}

		const customer = await client.customers.find(mandate.links.customer);
		if (
			!customer ||
			!customer.metadata ||
			!customer.metadata.additionalDetails
		) {
			throw new Error("Customer metadata is missing additionalDetails");
		}

		let additionalDetails = {};
		try {
			additionalDetails = JSON.parse(customer.metadata.additionalDetails);
		} catch (error) {
			console.error("Failed to parse additionalDetails:", error);
		}

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
			notes += "Payment not part of a subscription.";
			return {
				message: notes,
				status: 200,
				eventStatus: "N/A",
			};
		}
	} catch (error) {
		console.error("Error handling payment payout event:", error.message);

		// Ensure we only return serializable error data
		const errorMessage =
			error instanceof Error ? error.message : "Unknown error";

		return {
			message: "Error handling payment payout event",
			error: errorMessage,
			status: 500,
		};
	}
}
