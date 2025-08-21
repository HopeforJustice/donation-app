/*
 * billingRequest.js
 *
 * Creates a billing request with GoCardless
 * and returns an authorization url
 * recieves all form data in data param
 *
 * Imported getGoCardlessClient
 *		Creates and retrieves GoCardless client
 */

import { getGoCardlessClient } from "@/app/lib/gocardless/gocardlessclient";

const client = getGoCardlessClient();

/**
 * Validates and trims additionalDetails to ensure it's under 500 characters
 * Removes less important parameters in order of priority if needed
 */
export function validateAndTrimAdditionalDetails(details) {
	let currentDetails = { ...details };

	// Check if current details are within limit
	let detailsString = JSON.stringify(currentDetails);
	if (detailsString.length <= 500) {
		return currentDetails;
	}

	// Priority order for removal
	const removalSteps = [
		// UTM parameters
		() => {
			delete currentDetails.utmSource;
			delete currentDetails.utmMedium;
			delete currentDetails.utmCampaign;
		},
		// inspiration details
		() => {
			delete currentDetails.inspirationDetails;
		},
		// inspiration question
		() => {
			delete currentDetails.inspirationQuestion;
		},
	];

	// Try removing parameters step by step
	for (const removalStep of removalSteps) {
		removalStep();
		detailsString = JSON.stringify(currentDetails);

		if (detailsString.length <= 500) {
			console.log(
				`Additional details trimmed to ${detailsString.length} characters`
			);
			return currentDetails;
		}
	}

	// If still over limit after all removals, throw error
	throw new Error(
		`Additional details still exceed 500 character limit (${detailsString.length} characters) after removing optional parameters. Core donation data is too large.`
	);
}

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
			stateCounty: data.stateCounty,
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
			utmSource: data.utm_source || "unknown",
			utmMedium: data.utm_medium || "unknown",
			utmCampaign: data.utm_campaign || "unknown",
		};

		// Validate and trim additional details to fit within 500 character limit
		const validatedDetails =
			validateAndTrimAdditionalDetails(additionalDetails);

		console.log("creating billing request...");
		// Creaate billing request
		const billingRequest = await client.billingRequests.create({
			mandate_request: {
				scheme: "bacs",
			},
			//Store form data metadata
			metadata: {
				additionalDetails: JSON.stringify(validatedDetails),
			},
		});
		if (!billingRequest) {
			throw new Error("failed to create billing request");
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
