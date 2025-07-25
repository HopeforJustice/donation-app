import getDonorfyCredentials from "@/app/lib/donorfy/getDonorfyCredentials";
import makeDonorfyRequest from "@/app/lib/donorfy/makeDonorfyRequest";

export async function updateConstituent(data, constituentId, instance) {
	try {
		const { apiKey, tenant } = getDonorfyCredentials(instance);
		const authString = Buffer.from(`DonationApp:${apiKey}`).toString("base64");

		// Only include data fields that are defined
		const filteredData = Object.fromEntries(
			Object.entries({
				FirstName: data.firstName,
				LastName: data.lastName,
				AddressLine1: data.address1,
				AddressLine2: data.address2,
				Town: data.townCity,
				PostalCode: data.postcode,
				Phone1: data.phone,
				County: data.stateCounty,
				Country: data.country,
			}).filter(
				([_, value]) => value !== undefined && value !== null && value !== ""
			) // Exclude undefined and null values
		);

		const url = `https://data.donorfy.com/api/v1/${tenant}/constituents/${constituentId}`;

		const responseData = await makeDonorfyRequest(
			url,
			"PUT",
			authString,
			filteredData
		);
		return {
			message: "Update constituent successful",
		};
	} catch (error) {
		throw new Error(
			`Update Constituent failed, error: ${error.message}, constituentId: ${constituentId}`
		);
	}
}
