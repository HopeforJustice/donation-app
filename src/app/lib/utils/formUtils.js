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

// Helper function to get proper locale for currency
export const getLocaleForCurrency = (currency) => {
	switch (currency?.toLowerCase()) {
		case "nok":
			return "nb-NO"; // Norwegian
		case "gbp":
			return "en-GB"; // British English
		case "usd":
			return "en-US"; // US English
		case "aud":
			return "en-AU"; // Australian English
		default:
			return undefined; // Use browser default
	}
};

// Parse and format amount for display with proper localization
export const parseAndFormatAmount = (inputAmount, currency) => {
	// Handle Norwegian number format (comma as decimal separator) for display
	const amount = inputAmount
		? parseFloat(inputAmount.toString().replace(",", "."))
		: 0;

	// Return formatted amount based on locale
	if (amount % 1 === 0) {
		// Whole number — no decimals
		return amount.toLocaleString(getLocaleForCurrency(currency));
	} else {
		// Decimal — show 2 places
		return amount.toLocaleString(getLocaleForCurrency(currency), {
			minimumFractionDigits: 2,
			maximumFractionDigits: 2,
		});
	}
};
