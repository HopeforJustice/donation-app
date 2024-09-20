import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
const gocardless = require("gocardless-nodejs");
const constants = require("gocardless-nodejs/constants");

// Initialize GoCardless client
const client = gocardless(
	process.env.GOCARDLESS_ACCESS_TOKEN,
	constants.Environments.Sandbox // Use sandbox for testing; switch to live for production
);

export async function POST(req) {
	try {
		// Parse the request body to get customer data
		const {
			amount,
			title,
			firstName,
			lastName,
			email,
			directDebitStartDate,
			address1,
			address2,
			postcode,
			country,
			townCity,
			giftAid,
			emailPreference,
			postPreference,
			smsPreference,
			phonePreference,
			inspirationQuestion,
			inspirationDetails,
			givingFrequency,
		} = await req.json();

		//static values for this endpoint
		const paymentGateway = "GoCardless";
		const status = "pending";

		// Step 1: Create a billing request with a mandate
		const billingRequest = await client.billingRequests.create({
			mandate_request: {
				scheme: "bacs",
			},
		});

		if (!billingRequest || !billingRequest.id) {
			throw new Error("Failed to create billing request");
		}

		// Dynamic URL generation based on environment
		const successUrl =
			process.env.NODE_ENV === "production"
				? "https://your-production-site.com/success"
				: "http://localhost:3000/success";

		const exitUrl =
			process.env.NODE_ENV === "production"
				? "https://your-production-site.com/cancel"
				: "http://localhost:3000/cancel";

		// Step 2: Create the billing request flow with prefilled customer details and dynamic URLs
		const billingRequestFlow = await client.billingRequestFlows.create({
			redirect_uri: successUrl,
			exit_uri: exitUrl,
			prefilled_customer: {
				given_name: firstName,
				family_name: lastName,
				email: email,
			},
			links: {
				billing_request: billingRequest.id,
			},
		});

		if (!billingRequestFlow || !billingRequestFlow.authorisation_url) {
			throw new Error("Failed to create billing request flow");
		}

		// Step 3: Insert customer details into PostgreSQL using @vercel/postgres
		const result = await sql`
		INSERT INTO customers (
		  	gocardless_billing_request_id,
			donation_amount,
			collection_day,
			donation_frequency,
			payment_gateway,
			status,
			title,
			first_name,
			last_name,
			email,
			address1,
			address2,
			postcode,
			country,
			town_city,
			gift_aid,
			email_preference,
			post_preference,
			sms_preference,
			phone_preference,
			inspiration_question,
			inspiration_details
		)
		VALUES (
			${billingRequest.id},
			${amount},
			${directDebitStartDate},
			${givingFrequency},
			${paymentGateway},
			${status},
			${title},
			${firstName},
			${lastName},
			${email},
			${address1},
			${address2},
			${postcode},
			${country},
			${townCity},
			${giftAid},
			${emailPreference},
			${postPreference},
			${smsPreference},
			${phonePreference},
			${inspirationQuestion},
			${inspirationDetails})
		  RETURNING id;
		`;

		const customerId = result.rows[0].id;

		// Return the GoCardless authorization URL
		return NextResponse.json({
			authorisation_url: billingRequestFlow.authorisation_url,
			customerId: customerId,
		});
	} catch (error) {
		console.error("Error creating billing request:", error);
		return NextResponse.json(
			{ message: "Error processing billing request", error: error.message },
			{ status: 500 }
		);
	}
}
