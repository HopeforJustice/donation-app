import { getPayPalCredentials, getPayPalBaseUrl } from "./getPayPalCredentials";

/**
 * Get PayPal access token for API requests
 */
export async function getPayPalAccessToken(currency, mode = "test") {
	const { clientId, clientSecret } = getPayPalCredentials(currency, mode);
	const baseURL = getPayPalBaseUrl(mode);

	const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

	const response = await fetch(`${baseURL}/v1/oauth2/token`, {
		method: "POST",
		headers: {
			Authorization: `Basic ${auth}`,
			"Content-Type": "application/x-www-form-urlencoded",
		},
		body: "grant_type=client_credentials",
	});

	if (!response.ok) {
		const errorData = await response.text();
		console.error("PayPal auth error:", errorData);
		throw new Error("Failed to get PayPal access token");
	}

	const data = await response.json();
	return data.access_token;
}
