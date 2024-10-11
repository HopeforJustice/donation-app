import getDonorfyCredentials from "@/app/lib/donorfy/getDonorfyCredentials";
import makeDonorfyRequest from "@/app/lib/donorfy/makeDonorfyRequest";

export async function getConstituent(constituentId, instance) {
	try {
		const { apiKey, tenant } = getDonorfyCredentials(instance);
		const authString = Buffer.from(`DonationApp:${apiKey}`).toString("base64");

		const url = `https://data.donorfy.com/api/v1/${tenant}/constituents/${constituentId}`;

		const data = await makeDonorfyRequest(url, "GET", authString);

		return {
			message: "Get constituent successful",
			constituentData: data,
		};
	} catch (error) {
		console.error("Error:", error);
		throw new Error("Get constituent failed");
	}
}
