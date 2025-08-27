import { stepTemplates } from "./stepTemplates";
import { labelsAndDescriptions } from "./labelsAndDecriptions";
import { options } from "./selectOptions";

export function generateSteps({ currency, frequency }) {
	const countryCode = getCountryFromCurrency(currency);

	/*
	Shows fields or steps based on optional visibility conditions
	visibilityConditions = { currency: ['usd', 'gbp'], frequency: 'monthly' }
	context = { currency: 'usd', frequency: 'monthly' }
	-> isVisible returns true
	*/
	const context = { currency, frequency };

	function isVisible(conditions, context) {
		if (!conditions) return true;
		if (typeof conditions === "function") {
			return conditions(context);
		}

		for (let key in conditions) {
			const allowed = conditions[key];
			const value = context[key];
			if (Array.isArray(allowed)) {
				if (!allowed.includes(value)) return false;
			} else {
				if (value !== allowed) return false;
			}
		}
		return true;
	}

	function resolveText(token) {
		const text = labelsAndDescriptions[token];
		if (!text) return token;
		if (typeof text === "object") {
			if (Array.isArray(text)) return text;
			if (typeof text[countryCode] === "object") {
				return text[countryCode][frequency];
			}
			return text[countryCode] || text.default;
		}
		return text;
	}

	function resolveOptions(optionsToken) {
		return options[optionsToken] || [];
	}

	function fillStep(step) {
		const filledFields = step.fields.map(fillField).filter(Boolean);
		return {
			...step,
			title: resolveText(step.titleToken, context) || step.title,
			fields: filledFields,
			description: resolveText(step.descriptionToken) || null,
		};
	}

	function fillField(field) {
		//Only keep field if it's visible
		if (!isVisible(field.visibilityConditions, context)) return null;

		// If it's a field group process children
		if (field.type === "fieldGroup" && Array.isArray(field.fields)) {
			const filledFields = field.fields.map(fillField).filter(Boolean);
			if (filledFields.length === 0) return null;
			return {
				...field,
				fields: filledFields,
				label: resolveText(field.labelToken, context) || field.label,
				description:
					resolveText(field.descriptionToken, context) || field.description,
			};
		}

		// Normal field
		const filledField = {
			...field,
			label: resolveText(field.labelToken, context) || field.label,
			options: field.optionsToken
				? resolveOptions(field.optionsToken)
				: field.options,
			description:
				resolveText(field.descriptionToken, context) || field.description,
		};

		// Set default country value based on currency
		if (field.id === "country") {
			if (currency === "gbp") {
				filledField.defaultValue = "United Kingdom";
			} else if (currency === "usd") {
				filledField.defaultValue = "United States";
			}
		}

		return filledField;
	}

	return stepTemplates
		.filter((step) => isVisible(step.visibilityConditions, context))
		.map(fillStep)
		.filter((step) => step.fields.length > 0); // remove empty steps
}

function getCountryFromCurrency(currency) {
	switch (currency.toLowerCase()) {
		case "gbp":
			return "GB";
		case "usd":
			return "US";
		case "aud":
			return "AU";
		case "nok":
			return "NO";
		default:
			return "GB";
	}
}
