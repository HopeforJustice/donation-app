import getDonorfyCredentials from "@/app/lib/donorfy/getDonorfyCredentials";
import makeDonorfyRequest from "@/app/lib/donorfy/makeDonorfyRequest";

export async function updatePreferences(data, constituentId, instance) {
	try {
		const { apiKey, tenant } = getDonorfyCredentials(instance);
		const authString = Buffer.from(`DonationApp:${apiKey}`).toString("base64");

		const preferenceData = {
			PreferredChannel: "Email",
			PreferencesList: [
				{
					PreferenceType: "Channel",
					PreferenceName: "Email",
					PreferenceAllowed: data.emailPreference,
				},
				{
					PreferenceType: "Channel",
					PreferenceName: "Mail",
					PreferenceAllowed: data.postPreference,
				},
				{
					PreferenceType: "Channel",
					PreferenceName: "Phone",
					PreferenceAllowed: data.phonePreference,
				},
				{
					PreferenceType: "Channel",
					PreferenceName: "SMS",
					PreferenceAllowed: data.smsPreference,
				},
				{
					PreferenceType: "Purpose",
					PreferenceName: "Email Updates",
					PreferenceAllowed: data.emailPreference,
				},
			],
		};

		const url = `https://data.donorfy.com/api/v1/${tenant}/constituents/${constituentId}/Preferences`;

		await makeDonorfyRequest(url, "POST", authString, preferenceData);

		return {
			message: "Update constituent preferences successful",
		};
	} catch (error) {
		throw new Error(
			`Update Constituent Preferences failed, error: ${error.message}, constituentId: ${constituentId}`
		);
	}
}
