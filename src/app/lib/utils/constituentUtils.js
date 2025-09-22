/**
 * Constituent data processing utility functions
 * Handles Donorfy constituent operations, data mapping, and updates
 */

/**
 * Builds constituent update data with intelligent fallback logic
 * Priority: metadata → existing data → empty string
 * @param {Object} metadata - Form submission data
 * @param {Object} existingData - Current constituent data from Donorfy
 * @param {string} sessionEmail - Email from Stripe session
 * @param {string} donorfyInstance - "us" or "uk" to handle regional differences
 * @returns {Object} Formatted update data for Donorfy API
 */
export function buildConstituentUpdateData(
	metadata,
	existingData,
	sessionEmail,
	donorfyInstance
) {
	// Helper function to create fallback chain: new → existing → default
	const withFallback = (metadataField, existingField, defaultValue = "") =>
		metadataField || existingField || defaultValue;

	// Handle regional differences for County field
	const getCountyValue = () => {
		if (donorfyInstance === "us") {
			return withFallback(metadata.state, existingData.County);
		}
		return withFallback(metadata.stateCounty, existingData.County);
	};

	return {
		Title: withFallback(metadata.title, existingData.Title),
		FirstName: withFallback(metadata.firstName, existingData.FirstName),
		LastName: withFallback(metadata.lastName, existingData.LastName),
		AddressLine1: withFallback(metadata.address1, existingData.AddressLine1),
		AddressLine2: withFallback(metadata.address2, existingData.AddressLine2),
		Town: withFallback(metadata.townCity, existingData.Town),
		PostalCode: withFallback(metadata.postcode, existingData.PostalCode),
		EmailAddress: withFallback(sessionEmail, existingData.EmailAddress),
		Phone1: withFallback(metadata.phone, existingData.Phone1),
		County: getCountyValue(),
	};
}

/**
 * Builds constituent creation data for new donors
 * @param {Object} metadata - Form submission data
 * @param {string} sessionEmail - Email from Stripe session
 * @param {string} donorfyInstance - "us" or "uk" to handle regional differences
 * @param {string} campaign - Campaign identifier
 * @returns {Object} Formatted creation data for Donorfy API
 */
export function buildConstituentCreateData(
	metadata,
	sessionEmail,
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
		Town: metadata.townCity || "",
		PostalCode: metadata.postcode || "",
		EmailAddress: sessionEmail || "",
		Phone1: metadata.phone || "",
		RecruitmentCampaign: campaign || "",
		County:
			donorfyInstance === "us"
				? metadata.state || ""
				: metadata.stateCounty || "",
	};
}
