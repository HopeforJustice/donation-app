/**
 * Form-related utility functions
 * Handles input validation, formatting, and form data processing
 */

// Function to handle input to allow only numeric input including decimals
export const onlyNumbers = (e, currency) => {
	let value = e.target.value;

	if (currency === "nok") {
		//allow a single comma
		value = value.replace(/[^0-9,]/g, "");

		// Ensure there is only one comma
		const parts = value.split(",");
		if (parts.length > 2) {
			value = parts.slice(0, 2).join(",");
		}

		// Prevent multiple leading zeros if comma is not present
		if (!value.includes(",")) {
			value = value.replace(/^0+/, "0");
		}
	} else {
		//digits and a single period
		value = value.replace(/[^0-9.]/g, "");

		//only one period
		const parts = value.split(".");
		if (parts.length > 2) {
			value = parts.slice(0, 2).join(".");
		}

		//no multiple leading zeros if period is not present
		if (!value.includes(".")) {
			value = value.replace(/^0+/, "0");
		}
	}

	// Update the input value
	e.target.value = value;
};

// Handle phone number characters
export const handlePhoneInput = (event) => {
	event.target.value = event.target.value.replace(/[^0-9+()]/g, "");
};

// Format the amount field for NOK and other currencies
export const formatAmount = (amount, currency) => {
	// Replace any commas with periods to standardize the input
	let standardizedAmount = amount.replace(",", ".");

	// Parse the standardized amount as a float and format it to two decimal places
	let formattedAmount = parseFloat(standardizedAmount).toFixed(2);

	if (currency === "nok") {
		// Replace the decimal point with a comma for NOK
		formattedAmount = formattedAmount.replace(".", ",");
	}

	return formattedAmount;
};

export const matchFundingOn = (campaign) => {
	const fundingOnCampaigns = [];
	if (fundingOnCampaigns.includes(campaign)) {
		console.log("Match funding applied for campaign:", campaign);
		return true;
	}
	console.log("NO matchfunding for campaign:", campaign);
	return false;
};

// Get locale from currency code
export const getLocaleFromCurrency = (currency) => {
	const currencyToLocale = {
		gbp: "en-GB",
		usd: "en-US",
		nok: "nb-NO",
		aud: "en-AU",
		eur: "de-DE", // Default to German formatting for EUR
	};

	return currencyToLocale[currency?.toLowerCase()] || "en-US";
};

// Format amount with proper locale
export const formatAmountWithLocale = (amount, currency) => {
	const locale = getLocaleFromCurrency(currency);
	const numericAmount =
		typeof amount === "string" ? parseFloat(amount) : amount;

	if (isNaN(numericAmount)) return "0";

	return numericAmount.toLocaleString(locale, {
		minimumFractionDigits: 0,
		maximumFractionDigits: 2,
	});
};
