/*
 * billingRequest.js
 *
 * Creates a billing request with GoCardless
 * and returns an authorization url
 *
 * Imported getGoCardlessClient
 *		Creates and retrieves GoCardless client
 *
 *
 */

import { getGoCardlessClient } from "@/app/lib/gocardless/gocardlessclient";

const client = getGoCardlessClient();

export async function billingRequest(data) {
	try {
		const additionalDetails = {
			currency: data.currency,
			title: data.title,
			firstName: data.firstName,
			lastName: data.lastName,
			phone: data.phone,
			campaign: data.campaign,
			amount: data.amount,
			directDebitDay: data.directDebitStartDate,
			frequency: data.givingFrequency,
			preferences: {
				sms: data.smsPreference,
				post: data.postPreference,
				phone: data.phonePreference,
				email: data.emailPreference,
			},
			giftAid: data.giftAid,
			inspirationQuestion: data.inspirationQuestion,
			inspirationDetails: data.inspirationDetails,
		};

		console.log("creating billing request");
		// Creaate billing request
		const billingRequest = await client.billingRequests.create({
			mandate_request: {
				scheme: "bacs",
			},
			//Store form data metadata
			metadata: {
				additionalDetails: JSON.stringify(additionalDetails),
			},
		});
		if (!billingRequest) {
			throw new Error("failed to create billing request");
		} else {
			console.log("billing request:", billingRequest);
		}

		const successUrl =
			process.env.GC_SUCCESS_URL +
			`?name=${data.firstName}&amount=${data.amount}&frequency=${data.givingFrequency}&gateway=gocardless`;
		const exitUrl = process.env.GC_EXIT_URL;

		// Create the billing request flow with prefilled customer details and dynamic URLs
		const billingRequestFlow = await client.billingRequestFlows.create({
			redirect_uri: successUrl,
			exit_uri: exitUrl,
			prefilled_customer: {
				given_name: data.firstName,
				family_name: data.lastName,
				email: data.email,
				address_line1: data.address1,
				address_line2: data.address2,
				city: data.townCity,
				postal_code: data.postcode,
			},
			links: {
				billing_request: billingRequest.id,
			},
		});

		if (!billingRequestFlow) {
			throw new Error("Failed to create billing request flow");
		} else {
			console.log("billing request flow:", billingRequestFlow);
		}

		// Return the GoCardless authorisation URL
		return {
			authorisationUrl: billingRequestFlow.authorisation_url,
		};
	} catch (error) {
		throw new Error("Error creating billing request:", error);
	}
}
