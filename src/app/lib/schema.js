import { z } from "zod";

export const formSchema = z.object({
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
		.refine((val) => val >= 2, {
			message: "Please enter an amount of 2 or higher.",
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
	postcode: z.string(),
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
