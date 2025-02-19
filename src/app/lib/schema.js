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
	title: z.string().optional(),
	firstName: z.string().min(1, { message: "Please enter your first name" }),
	lastName: z.string().min(1, { message: "Please enter your last name" }),
	email: z.string().email({ message: "Please enter a valid email" }),
	phone: z
		.string()
		.min(5, { message: "Please enter a valid phone number" })
		.max(15, { message: "Please enter a valid phone number" }),
	directDebitStartDate: z.coerce
		.number()
		.min(1, { message: "Please select a date" }),
	address1: z.string().min(1, { message: "Please enter your address" }),
	address2: z.string().optional(),
	postcode: z
		.string()
		.regex(/^[A-Za-z0-9\s]{3,10}$/, "Invalid postcode format"),
	country: z.string().min(1, { message: "Please select your country" }),
	townCity: z.string().min(1, { message: "Please enter your Town/City" }),

	giftAid: z
		.string()
		.refine((value) => value === "true" || value === "false", {
			message: "This field is required",
		})
		.transform((value) => value === "true"), // Transform to boolean

	emailPreference: z
		.string()
		.refine((value) => value === "true" || value === "false", {
			message: "This field is required",
		})
		.transform((value) => value === "true"),

	postPreference: z
		.string()
		.refine((value) => value === "true" || value === "false", {
			message: "This field is required",
		})
		.transform((value) => value === "true"),

	smsPreference: z
		.string()
		.refine((value) => value === "true" || value === "false", {
			message: "This field is required",
		})
		.transform((value) => value === "true"),

	phonePreference: z
		.string()
		.refine((value) => value === "true" || value === "false", {
			message: "This field is required",
		})
		.transform((value) => value === "true"),

	inspirationQuestion: z.string().optional(),
	inspirationDetails: z
		.string()
		.max(100, { message: "Max 100 characters" })
		.optional(),
	givingFrequency: z.string().min(1, { message: "Please select frequency" }),
});
