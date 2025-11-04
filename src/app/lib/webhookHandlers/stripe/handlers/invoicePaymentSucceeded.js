/**
 * Handles the Stripe `invoice.payment_succeeded` webhook event.
 * (subscriptions with metadata source: donation-app)
 *
 * Steps performed:
 * 1. Extracts invoice data and retrieves the associated customer and subscription from Stripe.
 * 2. Extracts metadata from the subscription, customer, or invoice.
 * 3. Validates the webhook source to ensure it originated from the donation app.
 * 4. Ensures the invoice is related to a subscription.
 * 5. Determines if the payment is the initial subscription payment or a recurring payment.
 * 6. Initializes the Donorfy client based on the invoice currency.
 * 7. Finds the constituent in Donorfy by email or uses the provided constituentId from metadata.
 * 8. Creates a transaction in Donorfy for the payment.
 * 9. Returns a summary of the processing result or throws an error if any step fails.
 *
 * @param {object} event - The Stripe webhook event object.
 * @param {object} stripeClient - The initialized Stripe client instance.
 * @returns {Promise<object>} Result object containing processing status, details, and Donorfy transaction info.
 * @throws {Error} If any step fails during processing, an error is thrown with additional context.
 */

import { getDonorfyClient } from "@/app/lib/utils";

export async function handleInvoicePaymentSucceeded(event, stripeClient) {
	const invoice = event.data.object;
	const results = [];
	let currentStep = "";
	let constituentId = null;
	const donorfyInstance = invoice.currency === "usd" ? "us" : "uk";

	try {
		currentStep = "Extract invoice data and retrieve customer/subscription";
		let customer = null;
		let subscription = null;

		if (invoice.customer) {
			customer = await stripeClient.customers.retrieve(invoice.customer);
		}
		if (invoice.subscription) {
			subscription = await stripeClient.subscriptions.retrieve(
				invoice.subscription
			);
		}

		// Get metadata from subscription, customer, or invoice
		const metadata =
			subscription?.metadata || customer?.metadata || invoice.metadata || {};
		const source = metadata.source || "unknown";
		results.push({ step: currentStep, success: true });

		// Validate source
		currentStep = "Validate webhook source";
		if (source !== "donation-app") {
			console.log("Ignored invoice webhook from unknown source:", source);
			return {
				message: `Invoice webhook ignored - source: ${source}`,
				status: 200,
				eventStatus: "ignored",
				results,
			};
		}
		results.push({ step: currentStep, success: true });

		// Additional check: Only process subscription-related invoices
		currentStep = "Validate invoice is subscription-related";
		if (!invoice.subscription) {
			console.log("Ignored non-subscription invoice:", invoice.id);
			return {
				message: `Non-subscription invoice ignored: ${invoice.id}`,
				status: 200,
				eventStatus: "ignored",
				results,
			};
		}
		results.push({ step: currentStep, success: true });

		// Determine if this is the first payment or a recurring payment
		const isFirstPayment = invoice.billing_reason === "subscription_create";
		const paymentType = isFirstPayment
			? "Initial Subscription Payment"
			: "Recurring Payment";

		currentStep = "Initialize Donorfy client";
		const donorfy = getDonorfyClient(donorfyInstance);
		results.push({ step: currentStep, success: true });

		// Find constituent by email
		// need this to look for constituent by email if the constituent doesn't exist
		if (!metadata.constituentId) {
			currentStep = "Find constituent in Donorfy";
			const duplicateCheckData = await donorfy.duplicateCheck({
				EmailAddress: customer?.email,
			});

			if (duplicateCheckData.length > 0 && duplicateCheckData[0].Score >= 15) {
				constituentId = duplicateCheckData[0].ConstituentId;
				results.push({ step: currentStep, success: true });
			} else {
				throw new Error(
					`No matching constituent found for email: ${customer?.email}`
				);
			}
		} else {
			constituentId = metadata.constituentId;
		}

		// Create transaction
		currentStep = `Create transaction in Donorfy`;
		const transaction = await donorfy.createTransaction(
			invoice.amount_paid / 100,
			metadata.campaign || "Donation App General Campaign",
			"Stripe Subscription",
			constituentId,
			null,
			metadata.fund || "unrestricted",
			metadata.utmSource || "unknown",
			metadata.utmMedium || "unknown",
			metadata.utmCampaign || "unknown"
		);
		const transactionId = transaction.Id;
		results.push({ step: currentStep, success: true });

		console.log(results);
		return {
			message: `Stripe ${paymentType.toLowerCase()} processed. Transaction created for constituent ${constituentId}`,
			status: 200,
			eventStatus: "processed",
			results,
			constituentId,
			eventId: event.id,
			donorfyTransactionId: transactionId,
			subscriptionId: invoice.subscription,
		};
	} catch (error) {
		results.push({ step: currentStep, success: false });
		console.error("Error processing invoice webhook:", error);
		error.results = results;
		error.constituentId = constituentId || null;
		error.eventId = event.id;
		error.subscriptionId = invoice.subscription;
		throw error;
	}
}
