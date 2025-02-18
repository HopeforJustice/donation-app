/*
 * handleSubscriptionCancelled.js
 * Gocardless event for subscription cancelled
 * Get customer details from GoCardless
 * Delete active tag in Donorfy
 * Delete active tag in mailchimp
 *
 */
import { getGoCardlessClient } from "../gocardless/gocardlessclient";
import { addActivity } from "../donorfy/addActivity";
import { deleteActiveTag } from "../donorfy/deleteActiveTag";
import deleteTag from "../mailchimp/deleteTag";
const client = getGoCardlessClient();

export async function handleSubscriptionCancelled(event) {
	try {
		//Get details
		const subscriptionId = event.links.subscription;
		const subscription = await client.subscriptions.find(subscriptionId);
		const mandate = await client.mandates.find(subscription.links.mandate);
		const customer = await client.customers.find(mandate.links.customer);
		const additionalDetails = JSON.parse(customer.metadata.additionalDetails);
		const constituentId = customer.metadata.donorfyConstituentId;
		const donorfyInstance = "uk";
		let notes = "";
		console.log(customer);

		//Add Activity to Donorfy
		const activityData = {
			activityType: "Gocardless Subscription Cancelled",
			notes: `Amount: ${additionalDetails.amount}`,
			amount: additionalDetails.amount,
		};

		const addActivityData = await addActivity(
			activityData,
			constituentId,
			donorfyInstance
		);

		if (addActivityData.success) {
			notes += "Added Activity in Donorfy. ";
		} else {
			notes += "Activity creation failed in Donorfy. ";
			throw new Error(notes);
		}

		//Delete active Tag in Donorfy
		const deleteActiveTagData = await deleteActiveTag(
			"Gocardless_Active Subscription",
			constituentId,
			"uk"
		);

		if (deleteActiveTagData.success) {
			notes += "Tag removed in Donorfy. ";
		} else {
			notes += "Tag removed failed in Donorfy. ";
			throw new Error(notes);
		}

		// Delete tag in mailchimp
		const deleteTagData = await deleteTag(
			customer.email,
			"Gocardless Active Subscription",
			"uk"
		);

		if (deleteTagData.success) {
			notes += "Deleted tag on mailchimp";
		} else {
			notes += "failed to delete tag on mailchimp";
			throw new Error(notes);
		}
		return {
			message: notes,
			status: 200,
			eventStatus: "processed",
		};
	} catch (error) {
		console.error("Error handling subscription cancelled event:", error);
		throw error;
	}
}
