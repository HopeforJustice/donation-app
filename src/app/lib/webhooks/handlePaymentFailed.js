/*
 * handlePaymentFailed.js
 * Gocardless event for payments with failed status
 *
 */

import { getGoCardlessClient } from "@/app/lib/gocardless/gocardlessclient";
import getCustomerFromPaymentGatewayCustomer from "../db/getCustomerFromPaymentGatewayCustomer";
import pRetry from "p-retry";
import getSubscription from "../db/getSubscription";
import storePayment from "../db/storePayment";
import { addActivity } from "../donorfy/addActivity";

const client = getGoCardlessClient();

export async function handlePaymentFailed(event) {
	try {
		const paymentId = event.links.payment;
		const gatewayId = 1;
		const status = "paid out";
		const fallbackCampaign = "Donation App General Campaign";
		let notes = "";

		// Get the payment from GC
		const payment = await pRetry(() => client.payments.find(paymentId), {
			retries: 3,
			onFailedAttempt: (error) => {
				console.error(
					`Attempt ${error.attemptNumber} failed. There are ${error.retriesLeft} retries left.`
				);
			},
		});

		const amount = payment.amount;

		// Get the mandate from GC
		const mandate = await pRetry(
			() => client.mandates.find(payment.links.mandate),
			{
				retries: 3,
				onFailedAttempt: (error) => {
					console.error(
						`Attempt ${error.attemptNumber} failed. There are ${error.retriesLeft} retries left.`
					);
				},
			}
		);

		//Store the payment gateway customer id
		const paymentGatewayCustomerId = mandate.links.customer;

		notes += "Payment and customer details found in Gocardless. ";

		const customer = await pRetry(
			() => getCustomerFromPaymentGatewayCustomer(paymentGatewayCustomerId),
			{
				retries: 3,
				onFailedAttempt: (error) => {
					console.error(
						`Attempt ${error.attemptNumber} failed. There are ${error.retriesLeft} retries left.`
					);
				},
			}
		);

		// Handle case when customer is not found
		if (!customer) {
			notes += "Customer not in DB. ";
			console.log(notes);
			return {
				message: notes,
				status: 200,
				eventStatus: "database resource not found",
			};
		} else {
			notes += "Customer found in DB. ";
		}

		const constituentId = customer.rows[0].donorfy_constituent_id;
		const constituentNumber = customer.rows[0].donorfy_constituent_number;
		const donorfyInstance = customer.rows[0].donorfy_instance;
		const customerId = customer.rows[0].id;

		//If the payment is related to a subscription get the subscription from the db
		let subscription;
		if (payment.links.subscription) {
			const subscriptionData = await getSubscription(
				payment.links.subscription
			);
			subscription = subscriptionData.rows[0];
			notes += "subscription found. ";
		} else {
			notes += "payment not part of subscription. ";
		}

		//Set campaign based on subscription campaign or fallback
		const campaign = subscription?.campaign || fallbackCampaign;
		const subscriptionId = subscription?.id || null;

		console.log(
			constituentId,
			constituentNumber,
			donorfyInstance,
			"related subscription (will be undefined if testing with GC CLI): ",
			subscription,
			"subscription campaign:",
			campaign
		);

		//store payment in db
		const storePaymentData = await pRetry(
			() =>
				storePayment(
					customerId,
					subscriptionId,
					gatewayId,
					paymentId,
					status,
					campaign,
					amount
				),
			{
				retries: 3,
				onFailedAttempt: (error) => {
					console.error(
						`Attempt ${error.attemptNumber} failed. There are ${error.retriesLeft} retries left.`
					);
				},
			}
		);

		if (storePaymentData.success) {
			notes += "Payment stored in DB. ";
		} else {
			notes += "failed to store payment in DB. ";
			return {
				message: notes,
				status: 500,
				eventStatus: "failed",
			};
		}

		// Store Failed Gocardless Subscription Payment
		// Activity in Donorfy
		// Convert amount back to friendly values
		const friendlyAmount = amount / 100;

		const activityData = {
			activityType: "Gocardless Payment Failed",
			notes: `Amount: ${friendlyAmount}. Details: ${event.details.description}`,
		};

		const addActivityData = await pRetry(
			() => addActivity(activityData, constituentId, donorfyInstance),
			{
				retries: 3,
				onFailedAttempt: (error) => {
					console.error(
						`Attempt ${error.attemptNumber} failed. There are ${error.retriesLeft} retries left.`
					);
				},
			}
		).catch((error) => {
			console.error("All retries failed:", error);
			return {
				success: false,
				message: "Activity creation failed after retries",
			};
		});

		if (addActivityData.success) {
			notes += "Activity added in Donorfy. ";
			return {
				message: notes,
				status: 200,
				eventStatus: "processed",
			};
		} else {
			notes += "Activity creation failed in Donorfy. ";
			return {
				message: notes,
				status: 200,
				eventStatus: "failed",
			};
		}
	} catch (error) {
		console.error("Error handling payment failed event:", error);
		return {
			message: "Error handling payment failed event",
			error,
			status: 500,
		};
	}
}
