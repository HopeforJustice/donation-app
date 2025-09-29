import { z } from "zod";
import { findCurrencySymbol } from "./utils";

// Currency-specific minimum amounts
export const getMinimumAmount = (currency) => {
	switch (currency?.toLowerCase()) {
		case "gbp":
		case "usd":
		case "aud":
			return 2;
		case "nok":
			return 20;
		default:
			return 2;
	}
};

// Currency-specific minimum amount messages
export const getMinimumAmountMessage = (currency) => {
	const minimum = getMinimumAmount(currency);
	if (currency !== "nok") {
		return `Please enter an amount of ${findCurrencySymbol(
			currency
		)}${minimum} or higher.`;
	}
	return `Please enter an amount of ${minimum} ${findCurrencySymbol(
		currency
	)} or higher.`;
};

// Create schema function that takes currency as parameter
export const createDynamicFormSchema = (currency = "gbp") => {
	const minimumAmount = getMinimumAmount(currency);

	return z.object({
		currency: z.string().min(1, { message: "Please select a currency" }),
		amount: z
			.string()
			.min(1, { message: "Please enter a donation amount" })
			.transform((val) => {
				// Replace comma with period
				const transformedValue = val.replace(",", ".");
				return parseFloat(transformedValue); // Convert to a number
			})
			.refine((val) => !isNaN(val), {
				message: "Please enter a valid number.",
			})
			.refine((val) => val >= minimumAmount, {
				message: getMinimumAmountMessage(currency),
			}),
		title: z.string().min(1, { message: "Please select a title" }),
		firstName: z
			.string()
			.min(1, { message: "Please enter your first name" })
			.max(15, {
				message: "Max 15 characters",
			}),
		lastName: z
			.string()
			.min(1, { message: "Please enter your last name" })
			.max(15, {
				message: "Max 15 characters",
			}),
		email: z.string().email({ message: "Please enter a valid email" }),
		phone: z
			.string()
			.min(5, { message: "Please enter a valid phone number" })
			.max(15, { message: "Please enter a valid phone number" }),
		directDebitStartDate: z
			.union([
				z.coerce.number().min(1, { message: "Please select a date" }),
				z.undefined(),
			])
			.optional(),
		address1: z.string().min(1, { message: "Please enter your address" }),
		address2: z.string().optional(),
		postcode: z
			.string()
			.regex(
				/^([A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}|^\d{5}(-\d{4})?)$/i,
				"Invalid format"
			),
		country: z.string().min(1, { message: "Please select your country" }),
		stateCounty: z.string().optional(),
		townCity: z.string().min(1, { message: "Please enter your Town/City" }),

		giftAid: z
			.string()
			.optional()
			.refine(
				(value) => value === undefined || value === "true" || value === "false",
				{
					message: "This field is required",
				}
			)
			.transform((value) => value === "true"),

		emailPreference: z
			.boolean()
			.optional()
			.transform((value) => {
				if (value === undefined) return undefined;
				return value ? "true" : "false";
			}),

		postPreference: z
			.boolean()
			.optional()
			.transform((value) => {
				if (value === undefined) return undefined;
				return value ? "true" : "false";
			}),

		smsPreference: z
			.boolean()
			.optional()
			.transform((value) => {
				if (value === undefined) return undefined;
				return value ? "true" : "false";
			}),

		phonePreference: z
			.boolean()
			.optional()
			.transform((value) => {
				if (value === undefined) return undefined;
				return value ? "true" : "false";
			}),

		inspirationQuestion: z.string().optional(),
		inspirationDetails: z
			.string()
			.max(100, { message: "Max 100 characters" })
			.optional(),
		givingFrequency: z.string().min(1, { message: "Please select frequency" }),
	});
};

// Default export for backward compatibility
export const formSchema = createDynamicFormSchema();
