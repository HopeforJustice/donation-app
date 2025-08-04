// Get constituent preferences after they enter an email
// Currently hardcoded to UK, can change to be dynamic based on currency

import { NextResponse } from "next/server";
import { duplicateCheck } from "@/app/lib/donorfy/old/duplicateCheck";
import { getConstituentPreferences } from "@/app/lib/donorfy/old/getConstituentPreferences";

export async function POST(req) {
	const donorfyInstance = "uk";
	let constituentId;

	try {
		const { email } = await req.json();
		const duplicateCheckData = await duplicateCheck(email, donorfyInstance);

		if (!duplicateCheckData) {
			throw new Error("Donorfy duplicate check error");
		} else {
			constituentId = duplicateCheckData.constituentId;
		}

		if (!constituentId) {
			return NextResponse.json({ preferences: null }, { status: 200 });
		}

		const constituentPreferenceData = await getConstituentPreferences(
			constituentId,
			donorfyInstance
		);

		if (!constituentPreferenceData) {
			throw new Error("Get preferences error");
		} else {
			return NextResponse.json(
				{ preferences: constituentPreferenceData.preferences },
				{ status: 200 }
			);
		}
	} catch (error) {
		console.error("Error getting preferences:", error);
		return NextResponse.json(
			{ error: "Error getting preferences" },
			{ status: 500 }
		);
	}
}
