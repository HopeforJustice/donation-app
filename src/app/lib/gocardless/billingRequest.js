import { sql } from "@vercel/postgres";
import { getGoCardlessClient } from "@/app/lib/gocardless/gocardlessclient";

const client = getGoCardlessClient();

export async function billingRequest(data, customerId) {
	try {
		const paymentGatewayResult = await sql`
			SELECT id FROM payment_gateways WHERE name = 'gocardless';
		`;
		const paymentGatewayId = paymentGatewayResult.rows[0].id;

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

		const newBillingRequest = await sql`
        INSERT INTO billing_requests (
          customer_id,
          gateway_id,
          billing_request_id,
		  status,
		  amount,
		  frequency,
		  collection_day,
          created_at,
          updated_at,
		  campaign
        )
        VALUES (
          ${customerId},
          ${paymentGatewayId}, 
          ${billingRequest.id},    
          ${status}, 
		  ${data.amount},
		  ${data.givingFrequency},
		  ${data.directDebitStartDate},
          NOW(),
          NOW(),
		  ${data.campaign}
        )
        RETURNING id; 
      `;

		const successUrl =
			process.env.GC_SUCCESS_URL +
			`?name=${data.firstName}&amount=${data.amount}&frequency=${data.givingFrequency}&gateway="gocardless"`;
		const exitUrl = process.env.GC_EXIT_URL;

		// Step 2: Create the billing request flow with prefilled customer details and dynamic URLs
		// Can we prefill address details here too?
		const billingRequestFlow = await client.billingRequestFlows.create({
			redirect_uri: successUrl,
			exit_uri: exitUrl,
			prefilled_customer: {
				given_name: data.firstName,
				family_name: data.lastName,
				email: data.email,
			},
			links: {
				billing_request: billingRequest.id,
			},
		});

		if (!billingRequestFlow || !billingRequestFlow.authorisation_url) {
			throw new Error("Failed to create billing request flow");
		}

		// Return the GoCardless authorisation URL
		return {
			authorisationUrl: billingRequestFlow.authorisation_url,
			billingRequestId: newBillingRequest.rows[0].id,
		};
	} catch (error) {
		throw new Error("Error creating billing request:", error);
	}
}
