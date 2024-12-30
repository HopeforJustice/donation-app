/*
 * processDirectDebit.js
 *
 * Processes form submission for regular giving
 * Sets up Customer with Gocardless, stores form data in meta field as json
 * Sets up billing request and sends user to GoCardless for completion
 *
 */

import { NextResponse } from "next/server";

import { billingRequest } from "@/app/lib/gocardless/billingRequest";

export async function POST(req) {
	const formData = await req.json();

	try {
		// 6. Create billing request
		const billingRequestData = await billingRequest(formData);

		if (!billingRequestData) {
			throw new Error("Billing Request Error");
		} else {
			console.log(billingRequestData);
		}

		return NextResponse.json(
			{
				message: "Processing successful, redirecting to GoCardless",
				response: { authorisationUrl: billingRequestData.authorisationUrl },
			},
			{ status: 200 }
		);
	} catch (error) {
		console.error("Error processing data:", error);

		return NextResponse.json(
			{
				message: "Processing error",
				error: error,
			},
			{ status: 500 }
		);
	}
}
