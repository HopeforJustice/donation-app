/*
 * processDirectDebit.js
 *
 * Processes form submission data into Donorfy.
 * Sets up UK Direct debit with Gocardless.
 * No retries here as this impacts front end performance
 * user will be prompted to retry if there is an error.
 *
 */

import { NextResponse } from "next/server";
import sendErrorEmail from "@/app/lib/sendErrorEmail";

// Donorfy API functions
import { duplicateCheck } from "@/app/lib/donorfy/duplicateCheck";
import { createConstituent } from "@/app/lib/donorfy/createConstituent";
import { updateConstituent } from "@/app/lib/donorfy/updateConstituent";
import { updatePreferences } from "@/app/lib/donorfy/updatePreferences";
import { getConstituent } from "@/app/lib/donorfy/getConstituent";
import { createGiftAidDeclaration } from "@/app/lib/donorfy/createGiftAidDeclaration";
import { addActiveTags } from "@/app/lib/donorfy/addActiveTags";
import { addActivity } from "@/app/lib/donorfy/addActivity";
import handleCustomer from "@/app/lib/db/handleCustomer";
import { billingRequest } from "@/app/lib/gocardless/billingRequest";

export async function POST(req) {
	const formData = await req.json();
	const donorfyInstance = "uk"; //this process is only applicable to the UK
	let constituentId;
	let alreadyInDonorfy = false;
	let constituentNumber;

	try {
		//1. Donorfy duplicate check
		const duplicateCheckData = await duplicateCheck(
			formData.email,
			donorfyInstance
		);

		if (!duplicateCheckData) {
			throw new Error("Donorfy duplicate check error");
		}
		console.log("duplicate Check data: ", duplicateCheckData);

		if (duplicateCheckData.alreadyInDonorfy) alreadyInDonorfy = true;

		// 2. Create Donorfy Constituent if not already in Donorfy
		if (!alreadyInDonorfy) {
			const createConstituentData = await createConstituent(
				formData,
				donorfyInstance
			);

			if (!createConstituentData) {
				throw new Error("Donorfy create constituent error");
			}

			constituentId = createConstituentData.constituentId;
			console.log("New Constituent Data: ", createConstituentData);
		} else {
			constituentId = duplicateCheckData.constituentId;
		}

		// 3. Get Constituent Number (good to store in DB, searchable on CRM)
		const getConstituentData = await getConstituent(
			constituentId,
			donorfyInstance
		);

		if (!getConstituentData) {
			throw new Error("Donorfy get constituent error");
		}

		console.log("Constituent Data:", getConstituentData.message);
		constituentNumber = getConstituentData.constituentData.ConstituentNumber;

		/* 4. Concurrent Calls (now we have the constituent Id)
			Update Constituent (if they already exist)
			Update GDPR Preferences
			Create a GiftAid declaration (if they said yes)
			Create a tag based on the inspiration question
			Create an activity based on the inspiration question
			Handle customer | possibly create a new one, return id
		*/
		const concurrentCalls = [];

		// Possibly update constituent
		if (constituentId && alreadyInDonorfy) {
			const updateConstituentPromise = updateConstituent(
				formData,
				constituentId,
				donorfyInstance
			);
			concurrentCalls.push(updateConstituentPromise);
		}

		// Always update preferences (even for newly created constituents)
		const updatePreferencesPromise = updatePreferences(
			formData,
			constituentId,
			donorfyInstance
		);
		concurrentCalls.push(updatePreferencesPromise);

		// Possibly create Gift Aid declaration
		if (formData.giftAid) {
			const createGiftAidDeclarationPromise = createGiftAidDeclaration(
				formData,
				constituentId,
				donorfyInstance
			);
			concurrentCalls.push(createGiftAidDeclarationPromise);
		}

		// Possibly Add Active Tags (answer to the inspiration question value determines this)
		if (formData.inspirationQuestion) {
			const addActiveTagsPromise = addActiveTags(
				formData.inspirationQuestion,
				constituentId,
				donorfyInstance
			);
			concurrentCalls.push(addActiveTagsPromise);
		}

		// Possibly add activity for inspiration question
		if (formData.inspirationDetails) {
			const activityData = {
				activityType: "Donation inspiration",
				notes: formData.inspirationDetails,
			};
			const addActivityPromise = addActivity(
				activityData,
				constituentId,
				donorfyInstance
			);
			concurrentCalls.push(addActivityPromise);
		}

		// Run all concurrently
		const concurrentResults = await Promise.all(concurrentCalls);

		// Handle success/errors from other concurrent calls
		for (const result of concurrentResults) {
			if (!result || typeof result !== "object") {
				console.error("Invalid result from one of the promises:", result);
				throw new Error("Invalid result received");
			}

			// Check if there was an error in the result
			if (result.error) {
				console.error("Error in result:", result.error);
				throw new Error(
					result.error.message || "Error in concurrent operation"
				);
			}

			// Handle successful result, each result has a `message`
			if (result.message) {
				console.log("Success:", result.message);
			} else {
				console.log("Result received but no message:", result);
			}
		}

		// 5. Handle Customer in database
		const handleCustomerData = await handleCustomer(
			constituentId,
			donorfyInstance,
			alreadyInDonorfy,
			constituentNumber
		);

		if (!handleCustomerData) {
			throw new Error("Handle customer error");
		}
		console.log("Handle Customer: ", handleCustomerData.message);
		const customerId = handleCustomerData?.customerId;

		// 6. Create billing request and add necessary details
		const billingRequestData = await billingRequest(formData, customerId);

		if (!billingRequestData.authorisationUrl) {
			throw new Error("Billing Request Error");
		} else {
			console.log("Billing request successful");
		}

		return NextResponse.json(
			{
				message: "Processing successful, redirecting to GoCardless",
				response: { authorisationUrl: billingRequestData.authorisationUrl },
			},
			{ status: 200 }
		);
	} catch (error) {
		console.error("Error processing data:", error);

		//Send error email
		// await sendErrorEmail(error, {
		// 	email: formData.email,
		// 	step: "error processing constituent",
		// });

		return NextResponse.json(
			{
				message: "Processing error",
				error: error,
			},
			{ status: 500 }
		);
	}
}
