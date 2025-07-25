//creates a constituent and returns the id

import getDonorfyCredentials from "@/app/lib/donorfy/getDonorfyCredentials";
import makeDonorfyRequest from "@/app/lib/donorfy/makeDonorfyRequest";

export async function createConstituent(data, instance) {
	try {
		const { apiKey, tenant } = getDonorfyCredentials(instance);
		const authString = Buffer.from(`DonationApp:${apiKey}`).toString("base64");

		const filteredData = Object.fromEntries(
			Object.entries({
				ConstituentType: "individual", // donation app is currently only setup to work with individuals
				Title: data.title,
				FirstName: data.firstName,
				LastName: data.lastName,
				AddressLine1: data.address1,
				AddressLine2: data.address2,
				Town: data.townCity,
				County: data.stateCounty,
				Country: data.country,
				PostalCode: data.postcode,
				EmailAddress: data.email,
				Phone1: data.phone,
				RecruitmentCampaign: data.campaign,
			}).filter(
				([_, value]) => value !== undefined && value !== null && value !== ""
			) // Exclude undefined and null values
		);

		const url = `https://data.donorfy.com/api/v1/${tenant}/constituents/`;
		const responseData = await makeDonorfyRequest(
			url,
			"POST",
			authString,
			filteredData
		);

		return {
			constituentId: responseData.ConstituentId,
		};
	} catch (error) {
		throw new Error(`Create Constituent failed, error: ${error.message}`);
	}
}
