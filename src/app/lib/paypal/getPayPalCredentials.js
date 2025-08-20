/**
 * Get PayPal credentials based on currency and environment mode
 */
export function getPayPalCredentials(currency, mode = "test") {
	const currencyLower = currency.toLowerCase();
	const environment = mode === "live" ? "LIVE" : "SANDBOX";
	const region = currencyLower === "gbp" ? "UK" : "US";

	console.log(`Getting PayPal credentials for ${region} ${environment}`);

	// Use direct access instead of dynamic keys for reliability
	let clientId, clientSecret;

	if (region === "US" && environment === "SANDBOX") {
		clientId = process.env.NEXT_PUBLIC_PAYPAL_US_SANDBOX_CLIENT_ID;
		clientSecret = process.env.PAYPAL_US_SANDBOX_SECRET;
	} else if (region === "US" && environment === "LIVE") {
		clientId = process.env.PAYPAL_US_LIVE_CLIENT_ID;
		clientSecret = process.env.NEXT_PUBLIC_PAYPAL_US_LIVE_SECRET;
	} else if (region === "UK" && environment === "SANDBOX") {
		clientId = process.env.NEXT_PUBLIC_PAYPAL_UK_SANDBOX_CLIENT_ID;
		clientSecret = process.env.PAYPAL_UK_SANDBOX_SECRET;
	} else if (region === "UK" && environment === "LIVE") {
		clientId = process.env.NEXT_PUBLIC_PAYPAL_UK_LIVE_CLIENT_ID;
		clientSecret = process.env.PAYPAL_UK_LIVE_SECRET;
	}

	console.log(
		`Found clientId: ${clientId ? "yes" : "no"}, clientSecret: ${
			clientSecret ? "yes" : "no"
		}`
	);

	if (!clientId || !clientSecret) {
		console.error(
			`Available PayPal env vars:`,
			Object.keys(process.env).filter((key) => key.includes("PAYPAL"))
		);
		throw new Error(
			`PayPal credentials not configured for ${currency} in ${mode} mode (${region} ${environment})`
		);
	}

	return { clientId, clientSecret };
}

/**
 * Get PayPal client ID for frontend use
 */
export function getPayPalClientId(currency, mode = "test") {
	const { clientId } = getPayPalCredentials(currency, mode);
	return clientId;
}

/**
 * Get PayPal base URL based on environment mode
 */
export function getPayPalBaseUrl(mode = "test") {
	return mode === "live"
		? "https://api-m.paypal.com"
		: "https://api-m.sandbox.paypal.com";
}
