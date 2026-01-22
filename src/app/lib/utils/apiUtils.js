/**
 * API and data processing utility functions
 * Handles authentication, data fetching, and data transformation
 */

import DonorfyClient from "../donorfy/donorfyClient";

// Initialize Donorfy clients for both regions
const donorfyUK = new DonorfyClient(
	process.env.DONORFY_UK_KEY,
	process.env.DONORFY_UK_TENANT,
);
const donorfyUS = new DonorfyClient(
	process.env.DONORFY_US_KEY,
	process.env.DONORFY_US_TENANT,
);
const donorfyROW = new DonorfyClient(
	process.env.DONORFY_ROW_KEY,
	process.env.DONORFY_ROW_TENANT,
);
const donorfySandbox = new DonorfyClient(
	process.env.DONORFY_SANDBOX_KEY,
	process.env.DONORFY_SANDBOX_TENANT,
);

/**
 * Gets the appropriate Donorfy client based on instance/region
 * @param {string} instance - "us" or "uk" to determine which client to return
 * @returns {DonorfyClient} The appropriate Donorfy client instance (returns sandbox if not production)
 * @throws {Error} If invalid instance provided
 */
export function getDonorfyClient(instance) {
	//temp allow row to go through to live
	if (instance === "row") {
		return donorfyROW;
	}

	if (process.env.VERCEL_ENV !== "production" || instance === "sandbox") {
		console.log("Using Donorfy Sandbox instance");
		return donorfySandbox;
	}
	if (instance === "us") {
		return donorfyUS;
	} else if (instance === "uk") {
		return donorfyUK;
	} else if (instance === "row") {
		return donorfyROW;
	} else {
		throw new Error(`Invalid Donorfy instance: ${instance}.`);
	}
}

// fetchWithAuth helper function
export async function fetchWithAuth(url, method, body, apiKey) {
	const response = await fetch(url, {
		method,
		headers: {
			"Content-Type": "application/json",
			"next-api-key": apiKey,
		},
		body: JSON.stringify(body),
	});

	const data = await response.json();
	if (!response.ok) {
		throw new Error(data.message || "Request failed");
	}
	return data;
}

export async function extractPreferences(data) {
	const preferenceMapping = {
		Email: "emailPreference",
		Mail: "postPreference",
		Phone: "phonePreference",
		SMS: "smsPreference",
	};

	const extractedPreferences = {};
	if (data.preferences) {
		data.preferences.forEach((pref) => {
			if (
				pref.PreferenceType === "Channel" &&
				preferenceMapping[pref.PreferenceName]
			) {
				// Map the preference name to your schema's field name
				extractedPreferences[preferenceMapping[pref.PreferenceName]] =
					pref.PreferenceAllowed ?? false; // Use false if null
			}
		});
	}

	return extractedPreferences;
}

//call donorfy for preference data
export async function getPreferences(email) {
	const response = await fetch("/api/getPreferences", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ email }),
	});
	return await response.json();
}

// Generic polling utility for async operations
export async function poll(fn, { interval, timeout }) {
	const endTime = Date.now() + timeout;
	let result;
	while (Date.now() < endTime) {
		result = await fn();
		if (result) return result;
		await new Promise((res) => setTimeout(res, interval));
	}
	throw new Error("Poll timed out");
}

/**
 * Gets the appropriate SparkPost template based on currency, metadata, and template type
 * @param {string} currency - The currency code (e.g., "usd", "gbp")
 * @param {Object} metadata - The metadata/formdata object that may contain sparkPostTemplate override
 * @param {string} templateType - The type of template: "donation" (default) or "subscription"
 * @returns {string|null} The SparkPost template name or null if suppressed
 */
export function getSparkPostTemplate(
	currency,
	metadata = {},
	templateType = "donation",
) {
	// Start with default templates based on currency and type
	let template;

	if (templateType === "subscription") {
		// Subscription templates
		if (currency === "usd") {
			template = "usa-monthly-donation";
		} else if (currency === "gbp") {
			template = null; // UK subscriptions don't get automatic emails (monthly donations go via gocardless)
		} else {
			// Default fallback for other currencies
			template = null;
		}
	} else {
		// Donation receipt templates (default)
		if (currency === "usd") {
			template = "donation-receipt-2024-usa-stripe";
		} else if (currency === "gbp") {
			template = "donation-receipt-2024-uk-stripe";
		} else {
			// Default fallback for other currencies
			template = "donation-receipt-2024-uk-stripe";
		}
	}

	// Check for metadata override
	if (metadata.sparkPostTemplate) {
		// If set to "none", return null to suppress email
		if (metadata.sparkPostTemplate === "none") {
			return null;
		}
		// Otherwise use the custom template
		template = metadata.sparkPostTemplate;
	}

	return template;
}

/**
 * Sends a thank you email via SparkPost with campaign filtering and currency formatting
 * @param {string|null} sparkPostTemplate - The SparkPost template name or null to skip
 * @param {string} campaign - The campaign name (used for filtering)
 * @param {string} email - Recipient email address
 * @param {string} firstName - Recipient first name
 * @param {number} amount - Donation amount (as number)
 * @param {string} currency - Currency code (e.g., "usd", "gbp")
 * @param {Function} sendEmailFunction - The sendEmailByTemplateName function to use
 * @param {Array} excludedCampaigns - Array of campaign names to exclude (defaults to ["FreedomFoundation"])
 * @returns {Promise<boolean>} True if email was sent, false if skipped
 */
export async function sendThankYouEmail(
	sparkPostTemplate,
	campaign,
	email,
	firstName,
	amount,
	currency,
	sendEmailFunction,
	excludedCampaigns = ["FreedomFoundation", "2025 EOY"],
) {
	// Skip if no template or campaign is excluded
	if (!sparkPostTemplate || excludedCampaigns.includes(campaign)) {
		return false;
	}

	// Format currency symbol
	const currencySymbol = currency === "usd" ? "$" : "£";
	const friendlyAmount =
		typeof amount === "number" ? amount.toFixed(2) : amount;

	// Prepare substitution data
	const thankYouEmailSubstitutionData = {
		name: firstName,
		amount: `${currencySymbol}${friendlyAmount}`,
	};

	// Send email
	await sendEmailFunction(
		sparkPostTemplate,
		email,
		thankYouEmailSubstitutionData,
	);

	return true;
}
