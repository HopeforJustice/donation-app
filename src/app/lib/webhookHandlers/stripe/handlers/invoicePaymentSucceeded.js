import DonorfyClient from "../../../donorfy/donorfyClient";

const donorfyUK = new DonorfyClient(
	process.env.DONORFY_UK_KEY,
	process.env.DONORFY_UK_TENANT
);
const donorfyUS = new DonorfyClient(
	process.env.DONORFY_US_KEY,
	process.env.DONORFY_US_TENANT
);

function getDonorfyClient(instance) {
	return instance === "us" ? donorfyUS : donorfyUK;
}

export async function handleInvoicePaymentSucceeded(event, stripeClient) {
	const invoice = event.data.object;
	const results = [];
	let currentStep = "";
	let constituentId = null;
	let donorfyInstance;

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
		donorfyInstance = invoice.currency === "usd" ? "us" : "uk";
		const donorfy = getDonorfyClient(donorfyInstance);
		results.push({ step: currentStep, success: true });

		// Find constituent by email
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

		// Create transaction for the payment (both first and recurring)
		currentStep = `Create ${paymentType.toLowerCase()} transaction in Donorfy`;
		const transaction = await donorfy.createTransaction(
			invoice.amount_paid / 100,
			metadata.campaign ||
				(isFirstPayment ? "Subscription Donation" : "Recurring Donation"),
			"Stripe Subscription",
			constituentId,
			new Date(invoice.created * 1000), // Use invoice creation date
			metadata.fund || "unrestricted",
			metadata.utmSource || "",
			metadata.utmMedium || "",
			metadata.utmCampaign || ""
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
			subscriptionId: invoice.subscription, // Add subscription ID from invoice
		};
	} catch (error) {
		results.push({ step: currentStep, success: false });
		console.error("Error processing invoice webhook:", error);
		error.results = results;
		error.constituentId = constituentId || null;
		error.eventId = event.id;
		error.subscriptionId = invoice.subscription; // Add subscription ID to error response
		throw error;
	}
}
