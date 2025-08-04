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
import DonorfyClient from "@/app/lib/donorfy/donorfyClient";
// import { duplicateCheck } from "@/app/lib/donorfy/duplicateCheck";
// import { createConstituent } from "@/app/lib/donorfy/createConstituent";
// import { updateConstituent } from "@/app/lib/donorfy/updateConstituent";
// import { updatePreferences } from "@/app/lib/donorfy/updatePreferences";
// import { createGiftAidDeclaration } from "@/app/lib/donorfy/createGiftAidDeclaration";
// import { addActiveTags } from "@/app/lib/donorfy/addActiveTags";
// import { addActivity } from "@/app/lib/donorfy/addActivity";

const client = getGoCardlessClient();
const donorfyUK = new DonorfyClient(
	process.env.DONORFY_UK_KEY,
	process.env.DONORFY_UK_TENANT
);

export default async function newGoCardlessSubscriber(
	goCardlessCustomer,
	extractedData,
	results
) {
	let currentStep = "";
	let constituentId;
	let alreadyInDonorfy = false;
	try {
		currentStep = "Donorfy duplicate check";
		const duplicateCheckData = await donorfyUK.duplicateCheck({
			EmailAddress: extractedData.email,
		});
		results.push({ step: currentStep, success: true });

		// Find or create Constituent
		if (duplicateCheckData[0].Score >= 15) {
			currentStep = "Retrieve Constituent";
			constituentId = duplicateCheckData[0].ConstituentId;
			alreadyInDonorfy = true;
			results.push({ step: currentStep, success: true });
		} else {
			currentStep = "Create Constituent";
			const createConstituentInputData = {
				ConstituentType: "individual",
				Title: extractedData.additionalDetails.title || "Mr",
				FirstName: extractedData.firstName || "",
				LastName: extractedData.lastName || "",
				AddressLine1: extractedData.address1 || "",
				AddressLine2: extractedData.address2 || "",
				Town: extractedData.city || "",
				County: extractedData.stateCounty || "",
				PostalCode: extractedData.postalCode || "",
				EmailAddress: extractedData.email || "",
				Phone1: extractedData.additionalDetails.phone || "",
				RecruitmentCampaign: extractedData.additionalDetails.campaign || "",
			};
			const createConstituentData = await donorfyUK.createConstituent(
				createConstituentInputData
			);
			constituentId = createConstituentData.ConstituentId;
			results.push({ step: currentStep, success: true });
		}

		//Update GoCardless customer metadata
		currentStep = "Update GoCardless customer metadata";
		await client.customers.update(goCardlessCustomer.id, {
			metadata: {
				donorfyConstituentId: constituentId,
				additionalDetails: goCardlessCustomer.metadata.additionalDetails,
			},
		});
		results.push({ step: currentStep, success: true });

		//Possibly update constituent
		if (alreadyInDonorfy) {
			currentStep = "Update Constituent details in Donorfy";
			const updateConstituentInputData = {
				Title: extractedData.additionalDetails.title || "Mr",
				FirstName: extractedData.firstName || "",
				LastName: extractedData.lastName || "",
				AddressLine1: extractedData.address1 || "",
				AddressLine2: extractedData.address2 || "",
				Town: extractedData.city || "",
				County: extractedData.stateCounty || "",
				PostalCode: extractedData.postalCode || "",
				Phone1: extractedData.additionalDetails.phone || "",
			};
			await donorfyUK.updateConstituent(
				constituentId,
				updateConstituentInputData
			);
			results.push({ step: currentStep, success: true });
		}

		currentStep = "Update Constituent preferences in Donorfy";
		const updatePreferencesData = {
			PreferencesList: [
				{
					PreferenceType: "Channel",
					PreferenceName: "Email",
					PreferenceAllowed: extractedData.additionalDetails.preferences.email,
				},
				{
					PreferenceType: "Channel",
					PreferenceName: "Mail",
					PreferenceAllowed: extractedData.additionalDetails.preferences.post,
				},
				{
					PreferenceType: "Channel",
					PreferenceName: "Phone",
					PreferenceAllowed: extractedData.additionalDetails.preferences.phone,
				},
				{
					PreferenceType: "Channel",
					PreferenceName: "SMS",
					PreferenceAllowed: extractedData.additionalDetails.preferences.sms,
				},
				{
					PreferenceType: "Purpose",
					PreferenceName: "Email Updates",
					PreferenceAllowed: extractedData.additionalDetails.preferences.email,
				},
			],
		};
		await donorfyUK.updateConstituentPreferences(
			constituentId,
			updatePreferencesData
		);
		results.push({ step: currentStep, success: true });

		// Possibly add GiftAid declaration
		if (extractedData.additionalDetails.giftAid === "true") {
			currentStep = "Create Gift Aid declaration in Donorfy";
			await donorfyUK.createGiftAidDeclaration(constituentId, {
				TaxPayerTitle: extractedData.additionalDetails.title,
				TaxPayerFirstName: extractedData.firstName,
				TaxPayerLastName: extractedData.lastName,
			});
			results.push({ step: currentStep, success: true });
		}

		// Add donorfy tags
		currentStep = "Add active subscription tag in Donorfy";
		await donorfyUK.addActiveTags(
			constituentId,
			"Gocardless_Active Subscription"
		);
		results.push({ step: currentStep, success: true });

		if (extractedData.additionalDetails.inspirationQuestion) {
			currentStep = "Add inspiration tag in Donorfy";
			await donorfyUK.addActiveTags(
				constituentId,
				extractedData.additionalDetails.inspirationQuestion
			);
		}
		results.push({ step: currentStep, success: true });

		//Add donorfy Activities
		currentStep = "Add Subscription Activity in Donorfy";
		const activityData = {
			Notes: `Gocardless Subscription created. Amount: ${extractedData.additionalDetails.amount}`,
			ActivityType: "Gocardless Subscription",
			Number1: extractedData.additionalDetails.amount,
		};
		await donorfyUK.addActivity({
			...activityData,
			ExistingConstituentId: constituentId,
		});
		results.push({ step: currentStep, success: true });

		if (extractedData.additionalDetails.inspirationDetails) {
			currentStep = "Add Inspiration Activity in Donorfy";
			const inspirationActivityData = {
				Notes: extractedData.additionalDetails.inspirationDetails,
				ActivityType: "Donation inspiration",
			};
			await addActivity({
				...inspirationActivityData,
				ExistingConstituentId: constituentId,
			});
			results.push({ step: currentStep, success: true });
		}

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
