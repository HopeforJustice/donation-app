/**
 * Currency and formatting utility functions
 * Handles currency symbols, amount formatting, and regional differences
 */

// Function to find currency symbol based on three letter currency indication
export const findCurrencySymbol = (currency) => {
	switch (currency) {
		case "gbp":
			return "£";
		case "usd":
			return "$";
		case "nok":
			return "Kr";
		case "aud":
			return "$";
		default:
			return currency?.toUpperCase() || "";
	}
};
