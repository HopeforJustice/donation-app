import { useEffect, useCallback } from "react";

// Function to handle input to allow only numeric input including decimals
export const onlyNumbers = (e) => {
	const value = e.target.value;
	// Replace any character that is not a digit or a decimal point
	e.target.value = value.replace(/[^0-9.]/g, "");
	// Ensure that there is only one decimal point
	if (e.target.value.split(".").length > 2) {
		e.target.value = e.target.value.slice(0, -1);
	}
};
