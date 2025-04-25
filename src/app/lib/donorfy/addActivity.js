// Activity must exist in Donorfy

import getDonorfyCredentials from "@/app/lib/donorfy/getDonorfyCredentials";
import makeDonorfyRequest from "@/app/lib/donorfy/makeDonorfyRequest";

export async function addActivity(data, constituentId, instance) {
	try {
		const { apiKey, tenant } = getDonorfyCredentials(instance);
		const authString = Buffer.from(`DonationApp:${apiKey}`).toString("base64");

		const donorfyData = {
			Notes: data.notes,
			Campaign: data.campaign,
			ActivityType: data.activityType,
			ExistingConstituentId: constituentId,
			Number1: data.amount || 0,
		};

		const url = `https://data.donorfy.com/api/v1/${tenant}/Activities`;
		await makeDonorfyRequest(url, "POST", authString, donorfyData);

		return {
			success: true,
			message: "Add Activity successful",
		};
	} catch (error) {
		console.error("Error:", error);
		throw new Error("Add Activity failed");
	}
}
