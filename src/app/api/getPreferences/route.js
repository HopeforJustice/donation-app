// Get constituent preferences after they enter an email
// Currently hardcoded to UK, can change to be dynamic based on currency

import { NextResponse } from "next/server";
import { getDonorfyClient } from "@/app/lib/utils";

export async function POST(req) {
	//get the email from the request body
	const { email, currency } = await req.json();
	let donorfyInstance;
	switch (currency?.toLowerCase()) {
		case "usd":
			donorfyInstance = "us";
			break;
		case "eur":
		case "nok":
			donorfyInstance = "row";
			break;
		case "gbp":
		default:
			donorfyInstance = "uk";
			break;
	}
	const donorfy = getDonorfyClient(donorfyInstance);

	let constituentId;

	try {
		//timeout promise that resolves after 2 seconds
		const timeoutPromise = new Promise((resolve) =>
			setTimeout(() => resolve({ preferences: null }), 2000),
		);

		// Race between the actual operation and the timeout
		const result = await Promise.race([
			(async () => {
				const duplicateCheckData = await donorfy.duplicateCheck({
					EmailAddress: email,
				});

				if (!duplicateCheckData) {
					throw new Error("Donorfy duplicate check error");
				} else {
					constituentId = duplicateCheckData[0].ConstituentId;
				}

				if (!constituentId) {
					return { preferences: null };
				}

				const constituentPreferenceData =
					await donorfy.getConstituentPreferences(constituentId);

				if (!constituentPreferenceData) {
					throw new Error("Get preferences error");
				} else {
					return { preferences: constituentPreferenceData.PreferencesList };
				}
			})(),
			timeoutPromise,
		]);

		return NextResponse.json(result, { status: 200 });
	} catch (error) {
		console.error("Error getting preferences:", error);
		return NextResponse.json({ preferences: null }, { status: 200 });
	}
}
