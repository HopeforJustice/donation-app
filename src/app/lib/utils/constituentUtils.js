/**
 * Constituent data processing utility functions
 * Handles Donorfy constituent operations, data mapping, and updates
 */

/**
 * Builds constituent update data with intelligent fallback logic
 * Priority: metadata → existing data → empty string
 * @param {Object} metadata - Form submission data
 * @param {Object} existingData - Current constituent data from Donorfy
 * @param {string} email - Email used to populate Donorfy EmailAddress
 * @param {string} donorfyInstance - "us" or "uk" to handle regional differences
 * @returns {Object} Formatted update data for Donorfy API
 */
export function buildConstituentUpdateData(
	metadata,
	existingData,
	email,
	donorfyInstance
) {
	// Helper function to create fallback chain: new → existing → default
	const withFallback = (metadataField, existingField, defaultValue = "") =>
		metadataField || existingField || defaultValue;

	return {
		Title: withFallback(metadata.title, existingData.Title),
		FirstName: withFallback(metadata.firstName, existingData.FirstName),
		LastName: withFallback(metadata.lastName, existingData.LastName),
		AddressLine1: withFallback(metadata.address1, existingData.AddressLine1),
		AddressLine2: withFallback(metadata.address2, existingData.AddressLine2),
		Town: withFallback(metadata.city || metadata.townCity, existingData.Town),
		PostalCode: withFallback(
			metadata.postalCode || metadata.postcode,
			existingData.PostalCode
		),
		EmailAddress: withFallback(email, existingData.EmailAddress),
		Phone1: withFallback(metadata.phone, existingData.Phone1),
		County: withFallback(metadata.stateCounty, existingData.County),
		Country: withFallback(metadata.Country, existingData.Country),
	};
}

/**
 * Builds constituent creation data for new donors
 * @param {Object} metadata - Form submission data
 * @param {string} email - Email used to populate Donorfy EmailAddress
 * @param {string} donorfyInstance - "us" or "uk" to handle regional differences
 * @param {string} [campaign] - Campaign name for recruitment tracking
 * @returns {Object} Formatted creation data for Donorfy API
 */
export function buildConstituentCreateData(
	metadata,
	email,
	donorfyInstance,
	campaign
) {
	return {
		ConstituentType: "individual",
		Title: metadata.title || "",
		FirstName: metadata.firstName || "",
		LastName: metadata.lastName || "",
		AddressLine1: metadata.address1 || "",
		AddressLine2: metadata.address2 || "",
		Town: metadata.city || metadata.townCity || "",
		PostalCode: metadata.postalCode || metadata.postcode || "",
		EmailAddress: email || "",
		Phone1: metadata.phone || "",
		RecruitmentCampaign:
			campaign || metadata.campaign || "Donation App General Campaign",
		County:
			donorfyInstance === "us" ? metadata.stateCounty : metadata.state || "",
		Country: metadata.country || "",
	};
}

/**
 * Builds constituent preferences data for Donorfy
 * Handles regional differences where US defaults all preferences to true
 * @param {Object} metadata - Form submission data containing preference values (may be undefined/null)
 * @param {string} donorfyInstance - "us" or "uk" to handle regional differences
 * @returns {Object} Formatted preferences data for Donorfy API
 */
export function buildConstituentPreferencesData(metadata, donorfyInstance) {
	// Ensure metadata exists, default to empty object if not
	const safeMetadata = metadata || {};

	// US instance: All preferences default to true
	// UK instance: Use metadata values with fallback to false if field doesn't exist
	const getPreferenceValue = (metadataField) => {
		if (donorfyInstance === "us") {
			return true;
		}
		// For non US: use the metadata value if it exists, otherwise default to false
		return metadataField !== undefined ? metadataField : false;
	};

	return {
		PreferencesList: [
			{
				PreferenceType: "Channel",
				PreferenceName: "Email",
				PreferenceAllowed: getPreferenceValue(safeMetadata.emailPreference),
			},
			{
				PreferenceType: "Channel",
				PreferenceName: "Mail",
				PreferenceAllowed: getPreferenceValue(safeMetadata.postPreference),
			},
			{
				PreferenceType: "Channel",
				PreferenceName: "Phone",
				PreferenceAllowed: getPreferenceValue(safeMetadata.phonePreference),
			},
			{
				PreferenceType: "Channel",
				PreferenceName: "SMS",
				PreferenceAllowed: getPreferenceValue(safeMetadata.smsPreference),
			},
			{
				PreferenceType: "Purpose",
				PreferenceName: "Email Updates",
				PreferenceAllowed: getPreferenceValue(safeMetadata.emailPreference),
			},
		],
	};
}
