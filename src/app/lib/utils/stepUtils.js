/**
 * Step configuration utility functions
 * Handles dynamic step generation, field processing, and form structure
 */

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
