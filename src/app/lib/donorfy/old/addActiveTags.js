// Donorfy expects tagCategory_tagName

import getDonorfyCredentials from "@/app/lib/donorfy/old/getDonorfyCredentials";
import makeDonorfyRequest from "@/app/lib/donorfy/old/makeDonorfyRequest";

export async function addActiveTags(tags, constituentId, instance) {
	try {
		const { apiKey, tenant } = getDonorfyCredentials(instance);
		const authString = Buffer.from(`DonationApp:${apiKey}`).toString("base64");

		const url = `https://data.donorfy.com/api/v1/${tenant}/constituents/${constituentId}/AddActiveTags`;
		await makeDonorfyRequest(url, "POST", authString, tags);
	} catch (error) {
		throw new Error(
			`Add active tags failed, tags:${tags}, error: ${error.message}, constituentId: ${constituentId}`
		);
	}
}
