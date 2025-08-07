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

	// Helper to process a field (can be a direct field or subfield)
	function setDefaultForField(field) {
		const paramValue = searchParams.get(field.id);
		if (paramValue !== null) {
			defaultValues[field.id] = paramValue;
		} else if (field.defaultValue !== undefined) {
			defaultValues[field.id] = field.defaultValue;
		}
		if (field.id === "amount" && paramValue !== null) {
			amountProvided = true;
		}
		if (field.id === "currency" && paramValue !== null) {
			initialCurrency = paramValue;
		}
	}

	steps.forEach((step) => {
		step.fields.forEach((field) => {
			if (field.type === "fieldGroup" && Array.isArray(field.fields)) {
				field.fields.forEach(setDefaultForField);
			} else {
				setDefaultForField(field);
			}
		});
	});

	return { defaultValues, initialCurrency, amountProvided };
};

//edit fields based on url params if they exist
export const updateStepsWithParams = (steps, searchParams, paymentGateway) => {
	return steps.map((step) => {
		const newFields = step.fields.map((field) => {
			if (field.type === "fieldGroup") {
				let updatedField = { ...field };

				// Remove the description if using Stripe
				if (paymentGateway === "stripe" && field.id === "givingDetails") {
					updatedField.description = null;
					//specific description for Freedom Foundation
					if (searchParams.get("campaign") === "FreedomFoundation") {
						updatedField.description = (
							<p>
								This page is set up to take one off payments towards Freedom
								Foundation via card or bank transfer. If you are looking to
								donate in a different way please visit our{" "}
								<a
									className="underline"
									href="https://hopeforjustice.org/donate"
								>
									donate page
								</a>{" "}
								or{" "}
								<a
									className="underline"
									href="https://hopeforjustice.org/contact"
								>
									contact us
								</a>
							</p>
						);
					}
				}

				if (
					paymentGateway === "stripe" &&
					field.id === "directDebitStartDate"
				) {
					return null; // Remove the field
				}

				// Update subfields
				const newSubFields = updatedField.fields.map((subField) => {
					let updatedSubField = { ...subField };
					const defaultValue = searchParams.get(subField.id);
					if (defaultValue !== null) {
						updatedSubField.defaultValue = defaultValue;
					}
					if (
						searchParams.get("monthlyAllowed") === "false" &&
						subField.id === "givingFrequency"
					) {
						updatedSubField.options = [{ text: "Once", value: "once" }];
					}
					if (subField.id === "amount" && paymentGateway === "stripe") {
						updatedSubField.acceptedCurrencies = [
							{ text: "GBP", value: "gbp" },
							{ text: "USD", value: "usd" },
						];
					}
					return updatedSubField;
				});

				updatedField.fields = newSubFields;
				return updatedField;
			} else {
				// console.log("field", field);
				let updatedField = { ...field };

				const defaultValue = searchParams.get(field.id);
				if (defaultValue !== null) {
					updatedField.defaultValue = defaultValue;
				}

				return updatedField;
			}
		});
		return { ...step, fields: newFields };
	});
};

//edit the structure of the steps config based on currency
//and giving Frequency

//storing original GiftAid Step
// let giftAidStep;
// let step4;
// export const updateStepsBasedOnSelections = (
// 	steps,
// 	currency,
// 	givingFrequency
// ) => {
// 	console.log("updating steps based on selections");
// 	let updatedSteps = steps;
// 	if (steps.find((step) => step.id === "step3")) {
// 		giftAidStep = steps.find((step) => step.id === "step3");
// 	}
// 	if (steps.find((step) => step.id === "step4")) {
// 		step4 = steps.find((step) => step.id === "step4");
// 	}
// 	if (currency === "gbp" && giftAidStep) {
// 		// Ensure giftAidStep is included in updatedSteps
// 		if (!updatedSteps.some((step) => step.id === "step3")) {
// 			updatedSteps.splice(2, 0, giftAidStep); // Insert giftAidStep at the correct position
// 		}
// 		// Replace step 4 of updatedSteps with original step4
// 		updatedSteps = updatedSteps.map((step) =>
// 			step.id === "step4" ? step4 : step
// 		);
// 	}
// 	// Add / remove / edit fields based on currency and givingFrequency
// 	updatedSteps = updatedSteps
// 		.map((step) => {
// 			let newFields = step.fields
// 				.map((field) => {
// 					if (field.type === "fieldGroup") {
// 						let newSubFields = field.fields
// 							.map((subField) => {
// 								if (subField.id === "postcode" && currency === "usd") {
// 									subField.label = "ZIP Code";
// 									return subField;
// 								} else if (subField.id === "postcode" && currency === "gbp") {
// 									subField.label = "Postcode";
// 									return subField;
// 								} else {
// 									return subField;
// 								}
// 							})
// 							.filter(Boolean); // Remove null values
// 						return { ...field, fields: newSubFields };
// 					} else {
// 						if (
// 							field.id === "directDebitStartDate" &&
// 							(currency !== "gbp" || givingFrequency !== "monthly")
// 						) {
// 							return null;
// 						} else if (field.id === "stateCounty") {
// 							field.label = currency === "usd" ? "State" : "County";
// 							return field;
// 						} else {
// 							return field;
// 						}
// 					}
// 				})
// 				.filter(Boolean); // Remove null values

// 			// Changing step descriptions based on currency and givingFrequency
// 			if (
// 				step.id === "step2" &&
// 				(currency !== "gbp" ||
// 					(currency === "gbp" && givingFrequency !== "monthly"))
// 			) {
// 				step = {
// 					...step,
// 					description: null,
// 				};
// 			}

// 			if (step.id === "step4" && currency === "usd") {
// 				step = {
// 					...step,
// 					description: null,
// 					title: "Giving Summary",
// 				};
// 				step.fields = step.fields.filter(
// 					(field) => field.id !== "contactPreferences"
// 				);
// 				return step;
// 			}

// 			// Removing gift aid if the currency is not gbp
// 			if (step.id === "step3" && currency !== "gbp") {
// 				return null; // Remove the step
// 			}

// 			return { ...step, fields: newFields };
// 		})
// 		.filter(Boolean); // Remove null values
// 	return updatedSteps;
// };

//get fields that haven't been removed from the structure
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

//strip metadata from event object in webhook before storage in db
export const stripMetadata = (data) => {
	const { resource_metadata, metadata, ...strippedData } = data;
	return strippedData;
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
