import getDonorfyCredentials from "@/app/lib/donorfy/old/getDonorfyCredentials";
import makeDonorfyRequest from "@/app/lib/donorfy/old/makeDonorfyRequest";

export async function getGiftAidDeclaration(constituentId, instance) {
	try {
		const { apiKey, tenant } = getDonorfyCredentials(instance);
		const authString = Buffer.from(`DonationApp:${apiKey}`).toString("base64");

		const url = `https://data.donorfy.com/api/v1/${tenant}/constituents/${constituentId}/GiftAidDeclarations`;

		const data = await makeDonorfyRequest(url, "GET", authString);

		return data;
	} catch (error) {
		throw new Error(
			`Get Constituent gift aid declaration failed, error: ${error.message}, constituentId: ${constituentId}`
		);
	}
}
