/*
 * handleSubscriptionCancelled.js
 * Gocardless event for subscription cancelled
 * Get customer details from GoCardless
 * Delete active tag in Donorfy
 * Delete active tag in mailchimp
 *
 */
import { getGoCardlessClient } from "../../gocardless/gocardlessclient";
import deleteTag from "../../mailchimp/deleteTag";
const client = getGoCardlessClient();
import DonorfyClient from "@/app/lib/donorfy/donorfyClient";
import getSubscriber from "../../mailchimp/getSubscriber";
const donorfyUK = new DonorfyClient(
	process.env.DONORFY_UK_KEY,
	process.env.DONORFY_UK_TENANT
);

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

		if (!customer) {
			throw new Error("Customer not found in GoCardless");
		}

		// Delete tag in mailchimp
		currentStep = "Delete active tag in mailchimp";
		const constituent = await donorfyUK.getConstituent(constituentId);
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
		await donorfyUK.removeTag(constituentId, "Gocardless_Active Subscription");
		results.push({ step: currentStep, success: true });

		//add activity in donorfy
		currentStep = "Add Activity to Donorfy";
		await donorfyUK.addActivity({
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
