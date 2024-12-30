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
	}
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

// get default values from url or from config
export const extractDefaultValues = (steps, searchParams) => {
	const defaultValues = {};
	let initialCurrency = "gbp"; // Default currency
	let amountProvided = false; // Track if amount is provided in URL

	steps.forEach((step) => {
		step.fields.forEach((field) => {
			if (field.type === "fieldGroup") {
				//subfields
				field.fields.forEach((subField) => {
					const paramValue = searchParams.get(subField.id);
					//default is param
					if (paramValue) {
						defaultValues[subField.id] = paramValue;
					}
					//default is set in config
					if (subField.defaultValue && !defaultValues[subField.id]) {
						defaultValues[subField.id] = subField.defaultValue;
					}
					//amount has been provided
					//used to hide the amount fields
					if (subField.id === "amount" && paramValue) {
						amountProvided = true;
					}
					//set the initial currency if provided
					if (subField.id === "currency" && paramValue) {
						initialCurrency = paramValue;
					}
				});
			} else {
				//fields
				// refactor: should contain same logic as subfields
				//to allow structure to change
				const paramValue = searchParams.get(field.id);

				//is param vale
				if (paramValue) {
					defaultValues[field.id] = paramValue;
				}
				//has a default value in config
				if (field.defaultValue && !defaultValues[field.id]) {
					defaultValues[field.id] = field.defaultValue;
				}
			}
		});
	});

	return { defaultValues, initialCurrency, amountProvided };
};

//fill fields with url params if they exist
export const updateStepsWithParams = (steps, searchParams) => {
	return steps.map((step) => {
		const newFields = step.fields.map((field) => {
			if (field.type === "fieldGroup") {
				const newSubFields = field.fields.map((subField) => {
					const defaultValue = searchParams.get(subField.id);
					return defaultValue ? { ...subField, defaultValue } : subField;
				});
				return { ...field, fields: newSubFields };
			} else {
				const defaultValue = searchParams.get(field.id);
				return defaultValue ? { ...field, defaultValue } : field;
			}
		});
		return { ...step, fields: newFields };
	});
};

//edit the structure of the steps config based on currency
//and giving Frequency
export const updateStepsBasedOnSelections = (
	steps,
	currency,
	givingFrequency
) => {
	let updatedSteps = steps;

	// Add / remove / edit fields based on currency and givingFrequency
	updatedSteps = updatedSteps
		.map((step) => {
			let newFields = step.fields
				.map((field) => {
					if (field.type === "fieldGroup") {
						let newSubFields = field.fields
							.map((subField) => {
								if (subField.id === "specificField" && currency === "usd") {
									return subField;
								} else if (
									subField.id === "anotherField" &&
									givingFrequency === "monthly"
								) {
									return subField;
								} else {
									return subField;
								}
							})
							.filter(Boolean); // Remove null values
						return { ...field, fields: newSubFields };
					} else {
						if (
							field.id === "directDebitStartDate" &&
							(currency !== "gbp" || givingFrequency !== "monthly")
						) {
							return null;
						} else {
							return field;
						}
					}
				})
				.filter(Boolean); // Remove null values

			// Changing step descriptions based on currency and givingFrequency
			if (
				step.id === "step2" &&
				(currency !== "gbp" ||
					(currency === "gbp" && givingFrequency !== "monthly"))
			) {
				step = {
					...step,
					description: null,
				};
			}

			if (
				step.id === "step4" &&
				(currency !== "gbp" ||
					(currency === "gbp" && givingFrequency !== "monthly"))
			) {
				step = {
					...step,
					description: null,
				};
			}

			//removing a step based on currency and givingFrequency
			//step 3 is giftaid
			if (step.id === "step3" && currency === "usd") {
				return null; // Remove the step
			}

			return { ...step, fields: newFields };
		})
		.filter(Boolean); // Remove null values
	return updatedSteps;
};

//get fields that haven't been removed from the structure
// for accurate validation of remaining fields
export const getFieldIdsExcludingRemoved = (fields) => {
	return fields.reduce((acc, field) => {
		if (!field) {
			return acc;
		}
		if (field.type === "fieldGroup") {
			return acc.concat(
				field.fields
					.filter((subField) => subField)
					.map((subField) => subField.id)
			);
		}
		return acc.concat(field.id);
	}, []);
};

// get accepted currencies from config
// might be easier to do this differently
export const getAcceptedCurrencies = (steps) => {
	return steps
		.flatMap((step) =>
			step.fields.flatMap((field) =>
				field.type === "fieldGroup"
					? field.fields.flatMap(
							(subField) => subField.acceptedCurrencies || []
					  )
					: field.acceptedCurrencies || []
			)
		)
		.filter(
			(currency, index, self) =>
				self.findIndex((c) => c.value === currency.value) === index
		);
};

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
