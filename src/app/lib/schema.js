import { z } from "zod";

export const formSchema = z.object({
	amount: z.coerce
		.number()
		.gte(2, { message: "Please enter an amount of 2 or higher." }),
	title: z.string().optional(),
	firstName: z.string().min(1, { message: "Please enter your first name" }),
	lastName: z.string().min(1, { message: "Please enter your last name" }),
	email: z.string().email({ message: "Please enter a valid email" }),
	directDebitStartDate: z.coerce.number().min(1, "Please select a date"),
});
