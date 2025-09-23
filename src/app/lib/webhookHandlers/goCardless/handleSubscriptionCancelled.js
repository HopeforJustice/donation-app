/**
 * handleSubscriptionCancelled.js
 *
 * Handles the GoCardless "subscription cancelled" webhook event.
 *
 * Steps performed:
 * 1. Retrieve customer details from GoCardless using the subscription and mandate IDs.
 * 2. Parse additional details and Donorfy constituent ID from GoCardless customer metadata.
 * 3. Delete the "Gocardless Active Subscription" tag in Mailchimp for the customer, if a subscriber exists.
 * 4. Remove the "Gocardless_Active Subscription" tag in Donorfy for the constituent.
 * 5. Add an activity record in Donorfy to log the subscription cancellation, including the cancelled amount.
 * 6. Collect step-by-step results for auditing and error handling.
 *
 * @param {Object} event - The GoCardless webhook event object.
 * @returns {Promise<Object>} Result object with status, message, and step results.
 * @throws {Error} If any step fails, throws an error with step results and relevant IDs.
 */
import { getGoCardlessClient } from "../../gocardless/gocardlessclient";
import { getDonorfyClient } from "@/app/lib/utils";
import deleteTag from "../../mailchimp/deleteTag";
import getSubscriber from "../../mailchimp/getSubscriber";

const client = getGoCardlessClient();

export async function handleSubscriptionCancelled(event) {
	const results = [];
	let currentStep = "";
	let customer = null;
	let constituentId = null;

	try {
		// Initialize Donorfy client (GoCardless is UK-only)
		const donorfy = getDonorfyClient("uk");

		currentStep = "Retrieve customer details from GoCardless";
		const subscriptionId = event.links.subscription;
		const subscription = await client.subscriptions.find(subscriptionId);
		const mandate = await client.mandates.find(subscription.links.mandate);
		const customer = await client.customers.find(mandate.links.customer);
		const additionalDetails = JSON.parse(customer.metadata.additionalDetails);
		constituentId = customer.metadata.donorfyConstituentId;
		results.push({ step: currentStep, success: true });

		if (!customer) {
			throw new Error("Customer not found in GoCardless");
		}

		// Delete tag in mailchimp
		currentStep = "Delete active tag in mailchimp";
		const constituent = await donorfy.getConstituent(constituentId);
		let subscriber;
		try {
			subscriber = await getSubscriber(constituent.EmailAddress);
		} catch (error) {
			console.error(error);
		}
		if (subscriber) {
			await deleteTag(customer.email, "Gocardless Active Subscription", "uk");
		}
		results.push({ step: currentStep, success: true });

		// Delete tag in donorfy
		currentStep = "Delete active tag in Donorfy";
		await donorfy.removeTag(constituentId, "Gocardless_Active Subscription");
		results.push({ step: currentStep, success: true });

		//add activity in donorfy
		currentStep = "Add Activity to Donorfy";
		await donorfy.addActivity({
			ActivityType: "Gocardless Subscription Cancelled",
			Notes: `Amount: ${additionalDetails.amount}`,
			Number1: additionalDetails.amount,
			ExistingConstituentId: constituentId,
		});
		results.push({ step: currentStep, success: true });

		return {
			message: `Subscription cancelled for customer ${customer.id} and processed successfully into Donorfy`,
			status: 200,
			eventStatus: "processed",
			results: results,
		};
	} catch (error) {
		results.push({ step: currentStep, success: false, error: error.message });
		error.results = results;
		error.goCardlessCustomerId = customer?.id || null;
		error.constituentId = constituentId || null;
		throw error;
	}
}
