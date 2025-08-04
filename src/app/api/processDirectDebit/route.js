/*
 * processDirectDebit/route.js
 *
 * Processes client form submission for regular giving
 *
 * Imported billing request
 * 		Sets up Customer with Gocardless
 * 		stores additional form data in metadata field as json string
 *
 * Sets up billing request returns auth url
 *
 */

import { NextResponse } from "next/server";
import { billingRequest } from "@/app/lib/gocardless/billingRequest";

export async function POST(req) {
	const formData = await req.json();

	try {
		//Create billing request
		const billingRequestData = await billingRequest(formData);

		if (!billingRequestData) {
			throw new Error("Billing Request Error");
		}

		// Redirect to GoCardless authorisation URL
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
