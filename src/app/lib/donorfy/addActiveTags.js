// Donorfy expects tagCategory_tagName

import getDonorfyCredentials from "@/app/lib/donorfy/getDonorfyCredentials";
import makeDonorfyRequest from "@/app/lib/donorfy/makeDonorfyRequest";

export async function addActiveTags(tags, constituentId, instance) {
	try {
		const { apiKey, tenant } = getDonorfyCredentials(instance);
		const authString = Buffer.from(`DonationApp:${apiKey}`).toString("base64");

		const url = `https://data.donorfy.com/api/v1/${tenant}/constituents/${constituentId}/AddActiveTags`;
		await makeDonorfyRequest(url, "POST", authString, tags);

		return {
			message: "Add Active Tags successful",
		};
	} catch (error) {
		console.error("Error:", error);
		throw new Error("Add Active Tags failed");
	}
}
