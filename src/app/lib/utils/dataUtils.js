/**
 * Data processing and security utility functions
 * Handles data sanitization, logging, and security operations
 */

//strip metadata from event object in webhook before storage in db
export const stripMetadata = (data) => {
	if (!data || typeof data !== "object") {
		return data;
	}

	// Handle arrays
	if (Array.isArray(data)) {
		return data.map((item) => stripMetadata(item));
	}

	// Handle objects
	const result = {};
	for (const [key, value] of Object.entries(data)) {
		// Skip metadata fields at any level
		if (key === "metadata" || key === "resource_metadata") {
			continue;
		}

		// Recursively process nested objects/arrays
		if (value && typeof value === "object") {
			result[key] = stripMetadata(value);
		} else {
			result[key] = value;
		}
	}

	return result;
};

export const sanitiseForLogging = (body) => {
	if (!body || typeof body !== "string") return "[no body]";
	let data;
	try {
		data = JSON.parse(body);
	} catch (e) {
		return `[unparseable body: ${body}]`;
	}

	const sensitiveFields = [
		"email",
		"EmailAddress",
		"firstName",
		"FirstName",
		"lastName",
		"LastName",
		"address1",
		"address2",
		"AddressLine1",
		"AddressLine2",
		"townCity",
		"Town",
		"County",
		"Country",
		"postcode",
		"PostalCode",
		"phone",
		"Phone1",
		"title",
		"Title",
		"TaxPayerFirstName",
		"TaxPayerLastName",
	];

	sensitiveFields.forEach((field) => {
		if (data[field]) data[field] = "[REDACTED]";
	});

	return JSON.stringify(data);
};
