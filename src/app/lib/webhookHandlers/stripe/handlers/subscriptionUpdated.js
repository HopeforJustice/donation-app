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

export async function handleSubscriptionUpdated(event, stripeClient) {
	const subscription = event.data.object;
	const results = [];
	let currentStep = "";
	let constituentId = null;
	let donorfyInstance;

	try {
		// Extract and validate subscription data
		currentStep = "Extract subscription data and retrieve customer";
		let customer = null;
		if (subscription.customer) {
			customer = await stripeClient.customers.retrieve(subscription.customer);
		}

		// Get metadata from subscription or customer
		const metadata = subscription.metadata || customer?.metadata || {};
		const source = metadata.source || "unknown";
		results.push({ step: currentStep, success: true });

		// Validate source
		currentStep = "Validate webhook source";
		if (source !== "donation-app") {
			console.log(
				"Ignored subscription update webhook from unknown source:",
				source
			);
			return {
				message: `Subscription update webhook ignored - source: ${source}`,
				status: 200,
				eventStatus: "ignored",
				results,
			};
		}
		results.push({ step: currentStep, success: true });

		console.log(`Processing Stripe Subscription Updated`);

		currentStep = "Initialize Donorfy client";
		donorfyInstance = subscription.currency === "usd" ? "us" : "uk";
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

		// Add subscription update activity
		currentStep = "Add subscription update activity";
		const updateActivityData = {
			ExistingConstituentId: constituentId,
			ActivityType: "Subscription Updated",
			Notes: `Stripe Subscription ID: ${subscription.id}, Status: ${
				subscription.status
			}, Current amount: ${
				subscription.items.data[0]?.price?.unit_amount / 100 || 0
			} ${subscription.currency.toUpperCase()}`,
		};
		await donorfy.addActivity(updateActivityData);
		results.push({ step: currentStep, success: true });

		console.log(results);
		return {
			message: `Stripe subscription update recorded for constituent ${constituentId}`,
			status: 200,
			eventStatus: "processed",
			results,
			constituentId,
			eventId: event.id,
		};
	} catch (error) {
		results.push({ step: currentStep, success: false });
		console.error("Error processing subscription update webhook:", error);
		error.results = results;
		error.constituentId = constituentId || null;
		error.eventId = event.id;
		throw error;
	}
}
