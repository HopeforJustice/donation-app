/**
 * handlePaymentPaidOut.js
 * Handles GoCardless webhook events for payments with "paid out" status.
 *
 * Steps performed:
 * 1. Retrieve payment details from GoCardless using the payment ID from the event.
 * 2. Check if the payment is part of a subscription (or process in test mode).
 * 3. Retrieve mandate details associated with the payment.
 * 4. Retrieve customer details from GoCardless, including metadata.
 * 5. Parse additional details from customer metadata (e.g., campaign, UTM parameters).
 * 6. Create a transaction in Donorfy using the payment and customer details.
 * 7. Return a summary of the processing result, including Donorfy transaction ID.
 *
 * @param {Object} event - The GoCardless webhook event object.
 * @returns {Promise<Object>} Result of the processing, including status and transaction info.
 * @throws {Error} If any step fails, throws an error with details and partial results.
 */

import { getGoCardlessClient } from "@/app/lib/gocardless/gocardlessclient";
import { getDonorfyClient } from "@/app/lib/utils";

export async function handlePaymentPaidOut(event) {
	const client = getGoCardlessClient();
	const results = [];
	let currentStep = "";
	let customer = null;
	let constituentId = null;
	const test = process.env.VERCEL_ENV === "production" ? false : true;
	console.log("attempting to process payment paid out");

	try {
		// Initialize Donorfy client (GoCardless is UK-only)
		const donorfy = getDonorfyClient("uk");

		currentStep = "Retrieve payment details from GoCardless";
		const paymentId = event.links.payment;
		const payment = await client.payments.find(paymentId);
		if (!payment || !payment.links) {
			throw new Error("Payment or payment.links is undefined");
		}
		results.push({ step: currentStep, success: true });

		currentStep = "Check if payment is part of a subscription";
		const subscription = payment.links.subscription || null;
		const amount = payment.amount;
		// Ensure mandate and customer exist before accessing metadata
		if (!payment.links.mandate) {
			throw new Error("Payment is missing a mandate link");
		}
		results.push({ step: currentStep, success: true });

		// Only process payments that are part of a subscription
		if (subscription || test) {
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
			const fund = "Unrestricted";
			const paymentMethod = "GoCardless DD";
			const chargeDate = payment.charge_date;

			const createTransactionResult = await donorfy.createTransaction(
				friendlyAmount,
				campaign,
				paymentMethod,
				constituentId,
				chargeDate,
				fund,
				additionalDetails.utmSource || "unknown",
				additionalDetails.utmMedium || "unknown",
				additionalDetails.utmCampaign || "unknown"
			);
			if (createTransactionResult.Id) {
				results.push({ step: currentStep, success: true });
			} else {
				throw new Error("Failed to create transaction in Donorfy");
			}
			console.log(
				`Payment of ${friendlyAmount} processed successfully into Donorfy for subscription ${subscription} with transactionId ${createTransactionResult.Id}`
			);
			return {
				message: `Payment of ${friendlyAmount} processed successfully into Donorfy for subscription ${subscription}`,
				status: 200,
				eventStatus: "processed",
				results: results,
				donorfyTransactionId: createTransactionResult.Id,
				customerId: customer.id,
				constituentId: constituentId,
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
		console.error(error);
		error.results = results;
		error.goCardlessCustomerId = customer.id;
		error.constituentId = constituentId || null;
		throw error;
	}
}
