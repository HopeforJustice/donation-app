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

export async function handleInvoicePaymentFailed(event, stripeClient) {
	const invoice = event.data.object;
	const results = [];
	let currentStep = "";
	let constituentId = null;
	let donorfyInstance;

	try {
		currentStep = "Extract invoice data and retrieve customer";
		let customer = null;

		if (invoice.customer) {
			customer = await stripeClient.customers.retrieve(invoice.customer);
		}

		const metadata = customer?.metadata || invoice.metadata || {};
		const source = metadata.source || "unknown";
		results.push({ step: currentStep, success: true });

		// Validate source
		currentStep = "Validate webhook source";
		if (source !== "donation-app") {
			console.log(
				"Ignored failed payment webhook from unknown source:",
				source
			);
			return {
				message: `Failed payment webhook ignored - source: ${source}`,
				status: 200,
				eventStatus: "ignored",
				results,
			};
		}
		results.push({ step: currentStep, success: true });

		// Additional check: Only process subscription-related invoices
		currentStep = "Validate invoice is subscription-related";
		if (!invoice.subscription) {
			console.log("Ignored non-subscription failed payment:", invoice.id);
			return {
				message: `Non-subscription failed payment ignored: ${invoice.id}`,
				status: 200,
				eventStatus: "ignored",
				results,
			};
		}
		results.push({ step: currentStep, success: true });

		console.log(`Processing Stripe Invoice Payment Failed`);

		currentStep = "Initialize Donorfy client";
		donorfyInstance = invoice.currency === "usd" ? "us" : "uk";
		const donorfy = getDonorfyClient(donorfyInstance);
		results.push({ step: currentStep, success: true });

		// Find constituent by email
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

		// Add failed payment activity
		currentStep = "Add failed payment activity";
		const failedPaymentActivityData = {
			ExistingConstituentId: constituentId,
			ActivityType: "Stripe Subscription Payment Failed",
			Notes: `Stripe Invoice ID: ${invoice.id}, Amount: ${(
				invoice.amount_due / 100
			).toFixed(2)} ${invoice.currency.toUpperCase()}, Failure: ${
				invoice.last_finalization_error?.message || "Unknown error"
			}`,
		};
		await donorfy.addActivity(failedPaymentActivityData);
		results.push({ step: currentStep, success: true });

		console.log(results);
		return {
			message: `Stripe payment failure recorded for constituent ${constituentId}`,
			status: 200,
			eventStatus: "processed",
			results,
			constituentId,
			eventId: event.id,
		};
	} catch (error) {
		results.push({ step: currentStep, success: false });
		console.error("Error processing failed payment webhook:", error);
		error.results = results;
		error.constituentId = constituentId || null;
		error.eventId = event.id;
		throw error;
	}
}
