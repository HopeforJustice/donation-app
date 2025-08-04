//delete a constituent

import getDonorfyCredentials from "@/app/lib/donorfy/old/getDonorfyCredentials";
import makeDonorfyRequest from "@/app/lib/donorfy/old/makeDonorfyRequest";

export async function deleteConstituent(constituentId, instance) {
	try {
		const { apiKey, tenant } = getDonorfyCredentials(instance);
		const authString = Buffer.from(`DonationApp:${apiKey}`).toString("base64");

		const url = `https://data.donorfy.com/api/v1/${tenant}/constituents/${constituentId}`;
		const responseData = await makeDonorfyRequest(url, "DELETE", authString);

		return {
			responseData,
		};
	} catch (error) {
		throw new Error(`Delete Constituent failed, error: ${error.message}`);
	}
}
