// Donorfy expects tagCategory_tagName

import getDonorfyCredentials from "@/app/lib/donorfy/getDonorfyCredentials";
import makeDonorfyRequest from "@/app/lib/donorfy/makeDonorfyRequest";

export async function deleteActiveTag(tag, constituentId, instance) {
	try {
		const { apiKey, tenant } = getDonorfyCredentials(instance);
		const authString = Buffer.from(`DonationApp:${apiKey}`).toString("base64");

		const url = `https://data.donorfy.com/api/v1/${tenant}/constituents/${constituentId}/RemoveTag`;
		await makeDonorfyRequest(url, "DELETE", authString, tag);

		return {
			success: true,
			message: "Delete tag successful",
		};
	} catch (error) {
		throw new Error(
			`Delete Active Tag failed, tag:${tag}, error: ${error.message}, constituentId: ${constituentId}`
		);
	}
}
