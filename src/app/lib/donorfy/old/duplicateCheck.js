// duplicateCheck.js

import getDonorfyCredentials from "@/app/lib/donorfy/old/getDonorfyCredentials";
import makeDonorfyRequest from "@/app/lib/donorfy/old/makeDonorfyRequest";

export async function duplicateCheck(email, instance) {
	try {
		const { apiKey, tenant } = getDonorfyCredentials(instance);
		const authString = Buffer.from(`DonationApp:${apiKey}`).toString("base64");

		const url = `https://data.donorfy.com/api/v1/${tenant}/constituents/DuplicateCheckPerson`;
		const responseData = await makeDonorfyRequest(url, "POST", authString, {
			EmailAddress: email,
		});

		let constituentId;
		let alreadyInDonorfy = false;

		if (responseData?.[0]?.Score >= 15) {
			constituentId = responseData[0].ConstituentId;
			alreadyInDonorfy = true;
		}

		return {
			message: "Duplicate check successful",
			constituentId,
			alreadyInDonorfy,
		};
	} catch (error) {
		throw new Error(`Duplicate check failed, error: ${error.message}`);
	}
}
