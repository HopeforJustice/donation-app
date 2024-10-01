import { NextResponse } from "next/server";
import sendErrorEmail from "@/app/lib/sendErrorEmail";

export async function POST(req) {
	const formData = await req.json();

	try {
		const urlBase = process.env.NEXT_PUBLIC_API_URL;

		// 1. Donorfy Duplicate check
		const duplicateCheckResponse = await fetch(
			`${urlBase}/api/donorfy/uk/duplicateCheck`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"next-api-key": process.env.NEXT_API_KEY,
				},
				body: JSON.stringify({ email: formData.email }),
			}
		);
		const duplicateCheckData = await duplicateCheckResponse.json();

		if (!duplicateCheckResponse.ok) {
			console.error("Duplicate check Error:", duplicateCheckData);
			throw new Error(duplicateCheckData.message || "Duplicate check error");
		}

		let constituentId;
		let alreadyInDonorfy = false;

		// Set Constituent Id if found
		if (duplicateCheckData?.response?.[0]?.Score >= 15) {
			constituentId = duplicateCheckData.response[0].ConstituentId;
			alreadyInDonorfy = true;
		}

		// 2. Create Constituent if not found
		let createConstituentData;
		if (!alreadyInDonorfy) {
			const createConstituentResponse = await fetch(
				`${urlBase}/api/donorfy/uk/createConstituent`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						"next-api-key": process.env.NEXT_API_KEY,
					},
					body: JSON.stringify(formData),
				}
			);

			createConstituentData = await createConstituentResponse.json();

			if (!createConstituentResponse.ok) {
				console.error("Creating Constituent Error:", createConstituentData);
				throw new Error(
					createConstituentData.message || "Creating Constituent Error"
				);
			}

			constituentId = createConstituentData?.ConstituentId;
		}

		// 3. Update Constituent details if found in Donorfy
		if (constituentId && alreadyInDonorfy) {
			const updateConstituentResponse = await fetch(
				`${urlBase}/api/donorfy/uk/updateConstituent`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						"next-api-key": process.env.NEXT_API_KEY,
					},
					body: JSON.stringify({
						constituentId,
						formData,
					}),
				}
			);

			// Read response body once
			const updateConstituentData = await updateConstituentResponse.json();

			if (!updateConstituentResponse.ok) {
				console.error("Updating Constituent Error:", updateConstituentData);
				throw new Error(
					updateConstituentData.message || "Updating Constituent Error"
				);
			}
		}

		// 4. Update Constituent preferences
		const updateConstituentPreferencesResponse = await fetch(
			`${urlBase}/api/donorfy/uk/updatePreferences`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"next-api-key": process.env.NEXT_API_KEY,
				},
				body: JSON.stringify({
					constituentId,
					formData,
				}),
			}
		);

		// Read response body once
		const updateConstituentPreferencesData =
			await updateConstituentPreferencesResponse.json();

		if (!updateConstituentPreferencesResponse.ok) {
			console.error(
				"Updating Constituent Preferences Error:",
				updateConstituentPreferencesData
			);
			throw new Error(
				updateConstituentPreferencesData.message ||
					"Updating Constituent Preferences Error"
			);
		}

		// 5. Create billing request and add necessary details
		const billingRequestResponse = await fetch(
			`${urlBase}/api/billingRequest`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ constituentId, formData, alreadyInDonorfy }),
			}
		);

		// Read response body once
		const billingRequestData = await billingRequestResponse.json();

		if (!billingRequestResponse.ok) {
			console.error("Billing Request Error:", billingRequestData);
			throw new Error(billingRequestData.message || "Billing Request Error");
		}

		// Return authorization URL to the frontend
		const authUrl =
			billingRequestData.customerId && billingRequestData.authorisation_url
				? billingRequestData.authorisation_url
				: null;
		console.log("authurl", authUrl);

		return NextResponse.json(
			{
				message: "Processing successful, redirecting to GoCardless",
				response: { authorizationUrl: authUrl },
			},
			{ status: 200 }
		);
	} catch (error) {
		console.error("Error processing data:", error);

		// Send error email
		await sendErrorEmail(error, {
			email: formData.email,
			step: "error processing constituent",
		});

		return NextResponse.json(
			{
				message: "Processing error",
			},
			{ status: 500 }
		);
	}
}
