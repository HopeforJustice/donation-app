/**
 * API and data processing utility functions
 * Handles authentication, data fetching, and data transformation
 */

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
