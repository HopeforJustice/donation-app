import { z } from "zod";

export const formSchema = z.object({
	amount: z
		.string()
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
	phone: z.string().min(5, { message: "Please enter a valid phone number" }),
	directDebitStartDate: z.coerce
		.number()
		.min(1, { message: "Please select a date" }),
	address1: z.string().min(1, { message: "Please enter your address" }),
	address2: z.string().optional(),
	postcode: z.string().regex(/^[A-Za-z0-9]{3,10}$/, "Invalid postcode format"),
	country: z.string().min(1, { message: "Please select your country" }),
	townCity: z.string().min(1, { message: "Please enter your Town/City" }),
	giftAid: z
		.string()
		.transform((value) => value === "true") // Transform string to boolean
		.refine((val) => typeof val === "boolean", {
			message: "This field is required",
		}),
	emailPreference: z
		.string()
		.transform((value) => value === "true") // Transform string to boolean
		.refine((val) => typeof val === "boolean", {
			message: "This field is required",
		}),
	postPreference: z
		.string()
		.transform((value) => value === "true") // Transform string to boolean
		.refine((val) => typeof val === "boolean", {
			message: "This field is required",
		}),
	smsPreference: z
		.string()
		.transform((value) => value === "true") // Transform string to boolean
		.refine((val) => typeof val === "boolean", {
			message: "This field is required",
		}),
	phonePreference: z
		.string()
		.transform((value) => value === "true") // Transform string to boolean
		.refine((val) => typeof val === "boolean", {
			message: "This field is required",
		}),
	inspirationQuestion: z.string().optional(),
	inspirationDetails: z.string().optional(),
	givingFrequency: z.string().min(1, { message: "Please select frequency" }),
});
