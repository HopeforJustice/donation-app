/*
 * handleSubscriptionCancelled.js
 * Gocardless event for subscription cancelled
 * Get customer details from GoCardless
 * Delete active tag in Donorfy
 * Delete active tag in mailchimp
 *
 */
import { getGoCardlessClient } from "../../gocardless/gocardlessclient";
import { addActivity } from "../../donorfy/addActivity";
import { deleteActiveTag } from "../../donorfy/deleteActiveTag";
import deleteTag from "../../mailchimp/deleteTag";
const client = getGoCardlessClient();

export async function handleSubscriptionCancelled(event) {
	const results = [];
	let currentStep = "";
	let customer = null;
	let constituentId = null;

	try {
		currentStep = "Retrieve customer details from GoCardless";
		const subscriptionId = event.links.subscription;
		const subscription = await client.subscriptions.find(subscriptionId);
		const mandate = await client.mandates.find(subscription.links.mandate);
		const customer = await client.customers.find(mandate.links.customer);
		const additionalDetails = JSON.parse(customer.metadata.additionalDetails);
		constituentId = customer.metadata.donorfyConstituentId;
		results.push({ step: currentStep, success: true });

		currentStep = "Add Activity to Donorfy";
		const donorfyInstance = "uk";
		const activityData = {
			activityType: "Gocardless Subscription Cancelled",
			notes: `Amount: ${additionalDetails.amount}`,
			amount: additionalDetails.amount,
		};

		await addActivity(activityData, constituentId, donorfyInstance);
		results.push({ step: currentStep, success: true });

		//Delete active Tag in Donorfy
		currentStep = "Delete active tag in Donorfy";
		await deleteActiveTag(
			"Gocardless_Active Subscription",
			constituentId,
			"uk"
		);
		results.push({ step: currentStep, success: true });

		// Delete tag in mailchimp
		currentStep = "Delete active tag in mailchimp";
		await deleteTag(customer.email, "Gocardless Active Subscription", "uk");
		results.push({ step: currentStep, success: true });

		return {
			message: `Subscription cancelled for customer ${customer.id} and processed successfully into Donorfy`,
			status: 200,
			eventStatus: "processed",
			results: results,
		};
	} catch (error) {
		error.results = results;
		error.goCardlessCustomerId = customer?.id || null;
		error.constituentId = constituentId || null;
		throw error;
	}
}
