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
import { createTransaction } from "@/app/lib/donorfy/createTransaction";

const client = getGoCardlessClient();

export async function handlePaymentPaidOut(event) {
	const results = [];
	let currentStep = "";
	let customer = null;
	let constituentId = null;

	try {
		currentStep = "Retrieve payment details from GoCardless";
		const paymentId = event.links.payment;
		const payment = await client.payments.find(paymentId);
		if (!payment || !payment.links) {
			throw new Error("Payment or payment.links is undefined");
		}
		results.push({ step: currentStep, success: true });

		currentStep = "Check if payment is part of a subscription";
		const subscription = payment.links.subscription || null; // Ensure it is either a value or null
		const amount = payment.amount;
		// Ensure mandate and customer exist before accessing metadata
		if (!payment.links.mandate) {
			throw new Error("Payment is missing a mandate link");
		}
		results.push({ step: currentStep, success: true });

		// Only process payments that are part of a subscription
		if (subscription) {
			currentStep = "Retrieve mandate details from GoCardless";
			const mandate = await client.mandates.find(payment.links.mandate);
			if (!mandate || !mandate.links || !mandate.links.customer) {
				throw new Error("Mandate is missing customer link");
			}
			results.push({ step: currentStep, success: true });

			currentStep = "Retrieve customer details from GoCardless";
			customer = await client.customers.find(mandate.links.customer);
			if (
				!customer ||
				!customer.metadata ||
				!customer.metadata.additionalDetails
			) {
				throw new Error("Customer metadata is missing additionalDetails");
			}
			results.push({ step: currentStep, success: true });

			currentStep = "Retrieve additional details metadata from GoCardless";
			let additionalDetails = {};
			try {
				additionalDetails = JSON.parse(customer.metadata.additionalDetails);
			} catch (error) {
				console.error("Failed to parse additionalDetails:", error);
			}
			results.push({ step: currentStep, success: true });

			currentStep = "Create transaction in Donorfy";
			constituentId = customer.metadata.donorfyConstituentId;
			const campaign =
				additionalDetails.campaign || "Donation App General Campaign";
			const friendlyAmount = amount / 100;
			const product = "Donation";
			const fund = "Unrestricted";
			const channel = "Gocardless Subscription";
			const paymentMethod = "GoCardless DD";
			const donorfyInstance = "uk";
			const chargeDate = payment.charge_date;

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
			results.push({ step: currentStep, success: true });

			return {
				message: `Payment of ${friendlyAmount} processed successfully into Donorfy for subscription ${subscription}`,
				status: 200,
				eventStatus: "processed",
				results: results,
			};
		} else {
			return {
				message: "Payment not part of a subscription",
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
