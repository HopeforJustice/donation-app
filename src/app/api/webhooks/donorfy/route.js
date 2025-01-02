/*
 * Used for processing data into Donorfy CRM
 *
 * Req data has a type which determines the action
 */
import { NextResponse } from "next/server";
import { getGoCardlessClient } from "@/app/lib/gocardless/gocardlessclient";
import { duplicateCheck } from "@/app/lib/donorfy/duplicateCheck";
import { createConstituent } from "@/app/lib/donorfy/createConstituent";
import { updateConstituent } from "@/app/lib/donorfy/updateConstituent";
import { updatePreferences } from "@/app/lib/donorfy/updatePreferences";
import { createGiftAidDeclaration } from "@/app/lib/donorfy/createGiftAidDeclaration";
import { addActiveTags } from "@/app/lib/donorfy/addActiveTags";
import { addActivity } from "@/app/lib/donorfy/addActivity";
import storeWebhookEvent from "@/app/lib/db/storeWebhookEvent";
const client = getGoCardlessClient();

export async function POST(req) {
	const data = await req.json();
	console.log("webhook recieved:", data);
	let notes;
	try {
		if (data.type === "New GoCardless Subscriber") {
			/*
			 * New GoCardless Subscriber
			 * (UK only)
			 *
			 * Extract data from GoCardless using Customer Id
			 * Duplicate check in Donorfy -> Constituent Id
			 * Possibly create new constituent -> Constituent Id
			 * Add Constituent id to GoCardless metadata
			 * Possibly Update constituent details
			 * Update preferences
			 * Possibly Add Gift Aid declaration
			 * Add Inspiration tag
			 * Add Inspiration Activity with notes
			 * Add Subscription Activity
			 * Add Subscription Tag
			 * Store Webhook in db
			 *
			 */

			// Extract the data
			const goCardlessCustomer = await client.customers.find(data.customerId);
			const extractedData = {
				additionalDetails: JSON.parse(
					goCardlessCustomer.metadata.additionalDetails
				),
				email: goCardlessCustomer.email || "",
				firstName: goCardlessCustomer.given_name || "",
				lastName: goCardlessCustomer.family_name || "",
				address1: goCardlessCustomer.address_line1 || "",
				address2: goCardlessCustomer.address_line2 || "",
				city: goCardlessCustomer.city || "",
				postalCode: goCardlessCustomer.postal_code || "",
			};
			notes = "Extracted data from GoCardless. ";

			// Duplicate check in Donorfy
			const duplicateCheckData = await duplicateCheck(
				extractedData.email,
				"uk"
			);

			//Posibly create new constituent
			let constituentId;
			if (duplicateCheckData.alreadyInDonorfy) {
				constituentId = duplicateCheckData.constituentId;
				notes += "Found Duplicate in Donorfy. ";
			} else {
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
				notes += "Created New Constituent. ";
			}

			//Update gocardless metadata
			await client.customers.update(data.customerId, {
				metadata: {
					donorfyConstituentId: constituentId,
					additionalDetails: goCardlessCustomer.metadata.additionalDetails,
				},
			});
			notes += "GoCardless metadata updated. ";

			//Possibly update constituent
			if (duplicateCheckData.alreadyInDonorfy) {
				const updateConstituentInputData = {
					firstName: extractedData.firstName || "",
					lastName: extractedData.lastName || "",
					address1: extractedData.address1 || "",
					address2: extractedData.address2 || "",
					townCity: extractedData.city || "",
					postcode: extractedData.postalCode || "",
					phone: extractedData.additionalDetails.phone || "",
				};
				await updateConstituent(
					updateConstituentInputData,
					constituentId,
					"uk"
				);
				notes += "Updated constituent details. ";
			}

			// Update constituent preferences
			const updatePreferencesData = {
				emailPreference: extractedData.additionalDetails.preferences.email,
				postPreference: extractedData.additionalDetails.preferences.post,
				smsPreference: extractedData.additionalDetails.preferences.sms,
				phonePreference: extractedData.additionalDetails.preferences.phone,
			};
			await updatePreferences(updatePreferencesData, constituentId, "uk");
			notes += "Updated constituent preferences. ";

			// Possibly add GiftAid declaration
			if (extractedData.additionalDetails.giftAid === "true") {
				await createGiftAidDeclaration(
					{
						firstName: extractedData.firstName,
						lastName: extractedData.lastName,
					},
					constituentId,
					"uk"
				);
				notes += "Added GiftAid declaration. ";
			}

			//Add subscription tag
			await addActiveTags(
				"Gocardless_Active Subscription",
				constituentId,
				"uk"
			);
			notes += "Added active subscription tag. ";

			//Add inspiration tag
			await addActiveTags(
				extractedData.additionalDetails.inspirationQuestion,
				constituentId,
				"uk"
			);
			notes += "Added inspiration tag. ";

			//Add subscription activity
			const activityData = {
				notes: `Gocardless Subscription created. Amount: ${extractedData.additionalDetails.amount}`,
				activityType: "Gocardless Subscription",
			};
			await addActivity(activityData, constituentId, "uk");
			notes += "Subscription Activity added. ";

			//Add subscription activity
			const InspirationActivityData = {
				notes: extractedData.additionalDetails.inspirationDetails || "",
				activityType: "Donation inspiration",
			};
			await addActivity(InspirationActivityData, constituentId, "uk");
			notes += "Inspiration Activity added. ";
		}

		if (data.type === "New Payment from GoCardless Subscriber") {
		}

		//Add successful webhook record to db
		await storeWebhookEvent(data, "completed", notes);
		return NextResponse.json({ notes }, { status: 200 });
	} catch (error) {
		console.error("Error in API:", error);

		//Add unsuccessful webhook record to db
		await storeWebhookEvent(data, "failed", notes);

		return NextResponse.json(
			{ message: "Error processing request" },
			{ status: 500 }
		);
	}
}
