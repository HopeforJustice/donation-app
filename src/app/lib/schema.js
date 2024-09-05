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
	directDebitStartDate: z.coerce
		.number()
		.min(1, { message: "Please select a date" }),
	address1: z.string().min(1, { message: "Please enter your address" }),
	address2: z.string().optional(),
	postCode: z.string().regex(/^[A-Za-z0-9]{3,10}$/, "Invalid postcode format"),
	country: z.string().min(1, { message: "Please select your country" }),
	townCity: z.string().min(1, { message: "Please enter your Town/City" }),
	giftAid: z.string().min(1, { message: "This field is required" }),
	emailPreference: z.string().min(1, { message: "This field is required" }),
	postPreference: z.string().min(1, { message: "This field is required" }),
	smsPreference: z.string().min(1, { message: "This field is required" }),
	phonePreference: z.string().min(1, { message: "This field is required" }),
	inspirationQuestion: z.string().optional(),
	inspirationDetails: z.string().optional(),
	givingFrequency: z.string().min(1, { message: "Please select frequency" }),
});
