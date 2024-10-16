/*
 * handleSubscriptionCancelled.js
 * Gocardless event for subscription cancelled
 *
 */

import getSubscription from "../db/getSubscription";
import cancelSubscription from "../db/cancelSubscription";
import getCustomerFromId from "../db/getCustomerFromId";
import { addActivity } from "../donorfy/addActivity";
import { deleteActiveTag } from "../donorfy/deleteActiveTag";

export async function handleSubscriptionCancelled(event) {
	try {
		const subscriptionId = event.links.subscription;
		let notes = "";

		//Get the subscription from the database
		const subscriptionData = await getSubscription(subscriptionId);

		// Handle case when subscription is not found
		if (!subscriptionData) {
			notes += "Subscription not in DB. ";
			console.log(notes, subscriptionData);
			return {
				message: notes,
				status: 200,
				eventStatus: "database resource not found",
			};
		} else {
			notes += "Subscription found in DB. ";
		}

		//Update the subscription status
		if (subscriptionData.rows.length > 0) {
			const cancelSubscriptionData = await cancelSubscription(
				subscriptionData.rows[0].id
			);
			if (cancelSubscriptionData.success) {
				notes += "Cancelled Subscription in DB. ";
			}
		} else {
			notes += "failed to update subscription status to cancelled";
			throw new Error(notes);
		}

		const customerId = subscriptionData.rows[0].customer_id;
		const amount = subscriptionData.rows[0].amount;

		// Get customer data from db
		const customerData = await getCustomerFromId(customerId);

		if (!customerData.rows.length > 0) {
			notes += "Failed to get customer from DB. ";
			throw new Error(notes);
		} else {
			notes += "Customer found in DB. ";
		}

		const constituentId = customerData.rows[0].donorfy_constituent_id;
		const donorfyInstance = customerData.rows[0].donorfy_instance;

		const activityData = {
			activityType: "Gocardless Subscription Cancelled",
			notes: `Amount: ${amount}`,
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

		return {
			message: notes,
			status: 200,
			eventStatus: "processed",
		};

		// Add Activity in donorfy
	} catch (error) {
		console.error("Error handling subscription cancelled event:", error);
		throw error;
	}
}
