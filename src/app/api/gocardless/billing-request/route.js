import { NextResponse } from "next/server";
const gocardless = require("gocardless-nodejs");
const constants = require("gocardless-nodejs/constants");

// Initialize GoCardless client
const client = gocardless(
	process.env.GOCARDLESS_ACCESS_TOKEN, // Ensure this is correct
	constants.Environments.Sandbox // Use sandbox for testing; switch to live for production
);

export async function POST(req) {
	try {
		const { firstName, lastName, email } = await req.json();

		// Step 1: Create a billing request with a mandate
		const billingRequest = await client.billingRequests.create({
			mandate_request: {
				scheme: "bacs",
			},
		});

		//Step 2: Create the billing request flow with prefilled customer details
		const billingRequestFlow = await client.billingRequestFlows.create({
			redirect_uri: "http://localhost:3000/success", // Local redirect for success
			exit_uri: "http://localhost:3000/cancel", // Local redirect for cancellation
			prefilled_customer: {
				given_name: firstName,
				family_name: lastName,
				email: email,
			},
			links: {
				billing_request: billingRequest.id,
			},
		});

		// Return the authorization URL to redirect the user to GoCardless's hosted page
		return NextResponse.json({
			authorisation_url: billingRequestFlow.authorisation_url,
			billingRequest: billingRequest,
		});
	} catch (error) {
		// Log and handle errors properly
		console.error(
			"Error creating billing request:",
			error.response ? error.response.data : error.message
		);
		return NextResponse.json(
			{ message: "Error creating billing request", error: error.message },
			{ status: 500 }
		);
	}
}
