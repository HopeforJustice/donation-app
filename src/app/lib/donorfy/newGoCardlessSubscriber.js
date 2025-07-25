/*
 * newGoCardlessSubscriber.js
 *
 * New GoCardless Subscriber
 * (UK only)
 *
 * Extract data from GoCardless using Customer Id
 * Duplicate check in Donorfy -> Constituent Id
 * Possibly create new constituent -> Constituent Id
 * Add Constituent Id to GoCardless metadata
 * Possibly Update Constituent details
 * Update preferences
 * Possibly Add Gift Aid declaration
 * Add Inspiration tag
 * Add Inspiration Activity with notes
 * Add Subscription Activity
 * Add Subscription Tag
 * Store Webhook in db (?)
 *
 */

import { getGoCardlessClient } from "@/app/lib/gocardless/gocardlessclient";
import { duplicateCheck } from "@/app/lib/donorfy/duplicateCheck";
import { createConstituent } from "@/app/lib/donorfy/createConstituent";
import { updateConstituent } from "@/app/lib/donorfy/updateConstituent";
import { updatePreferences } from "@/app/lib/donorfy/updatePreferences";
import { createGiftAidDeclaration } from "@/app/lib/donorfy/createGiftAidDeclaration";
import { addActiveTags } from "@/app/lib/donorfy/addActiveTags";
import { addActivity } from "@/app/lib/donorfy/addActivity";

const client = getGoCardlessClient();

export default async function newGoCardlessSubscriber(
	goCardlessCustomer,
	extractedData,
	results = []
) {
	let currentStep = "";
	let constituentId;
	try {
		currentStep = "Donorfy duplicate check";
		const duplicateCheckData = await duplicateCheck(extractedData.email, "uk");
		results.push({ step: currentStep, success: true });

		// Find or create Constituent
		if (duplicateCheckData.alreadyInDonorfy) {
			currentStep = "Retrieve Constituent";
			constituentId = duplicateCheckData.constituentId;
			results.push({ step: currentStep, success: true });
		} else {
			currentStep = "Create Constituent";
			const createConstituentInputData = {
				firstName: extractedData.firstName || "",
				lastName: extractedData.lastName || "",
				address1: extractedData.address1 || "",
				address2: extractedData.address2 || "",
				townCity: extractedData.city || "",
				postcode: extractedData.postalCode || "",
				email: extractedData.email || "",
				phone: extractedData.additionalDetails.phone || "",
				campaign: extractedData.additionalDetails.campaign || "",
			};
			const createConstituentData = await createConstituent(
				createConstituentInputData,
				"uk"
			);
			constituentId = createConstituentData.constituentId;
			results.push({ step: currentStep, success: true });
		}

		//Update GoCardless customer metadata
		currentStep = "Update GoCardless customer metadata";
		await client.customers.update(data.customerId, {
			metadata: {
				donorfyConstituentId: constituentId,
				additionalDetails: goCardlessCustomer.metadata.additionalDetails,
			},
		});
		results.push({ step: currentStep, success: true });

		//Possibly update constituent
		if (duplicateCheckData.alreadyInDonorfy) {
			currentStep = "Update Constituent details in Donorfy";
			const updateConstituentInputData = {
				firstName: extractedData.firstName || "",
				lastName: extractedData.lastName || "",
				address1: extractedData.address1 || "",
				address2: extractedData.address2 || "",
				townCity: extractedData.city || "",
				postcode: extractedData.postalCode || "",
				phone: extractedData.additionalDetails.phone || "",
			};
			await updateConstituent(updateConstituentInputData, constituentId, "uk");
			results.push({ step: currentStep, success: true });
		}

		currentStep = "Update Constituent preferences in Donorfy";
		const updatePreferencesData = {
			emailPreference: extractedData.additionalDetails.preferences.email,
			postPreference: extractedData.additionalDetails.preferences.post,
			smsPreference: extractedData.additionalDetails.preferences.sms,
			phonePreference: extractedData.additionalDetails.preferences.phone,
		};
		await updatePreferences(updatePreferencesData, constituentId, "uk");
		results.push({ step: currentStep, success: true });

		// Possibly add GiftAid declaration
		if (extractedData.additionalDetails.giftAid === "true") {
			currentStep = "Create Gift Aid declaration in Donorfy";
			await createGiftAidDeclaration(
				{
					firstName: extractedData.firstName,
					lastName: extractedData.lastName,
				},
				constituentId,
				"uk"
			);
			results.push({ step: currentStep, success: true });
		}

		// Add donorfy tags
		currentStep = "Add active subscription tag in Donorfy";
		await addActiveTags("Gocardless_Active Subscription", constituentId, "uk");
		results.push({ step: currentStep, success: true });

		currentStep = "Add inspiration tag in Donorfy";
		await addActiveTags(
			extractedData.additionalDetails.inspirationQuestion,
			constituentId,
			"uk"
		);
		results.push({ step: currentStep, success: true });

		//Add donorfy Activities
		currentStep = "Add Subscription Activity in Donorfy";
		const activityData = {
			notes: `Gocardless Subscription created. Amount: ${extractedData.additionalDetails.amount}`,
			activityType: "Gocardless Subscription",
			amount: extractedData.additionalDetails.amount,
		};
		await addActivity(activityData, constituentId, "uk");
		results.push({ step: currentStep, success: true });

		currentStep = "Add Inspiration Activity in Donorfy";
		const InspirationActivityData = {
			notes: extractedData.additionalDetails.inspirationDetails || "",
			activityType: "Donation inspiration",
		};
		await addActivity(InspirationActivityData, constituentId, "uk");
		results.push({ step: currentStep, success: true });

		return {
			constituentId: constituentId,
			goCardlessCustomerId: goCardlessCustomer?.id || null,
		};
	} catch (error) {
		results.push({ step: currentStep, success: false, error: error.message });
		error.results = results;
		error.constituentId = constituentId || null;
		error.goCardlessCustomerId = goCardlessCustomer?.id || null;
		throw error;
	}
}
