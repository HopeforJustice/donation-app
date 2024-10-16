/*
 * StorePayment.js
 *
 *
 */

import { sql } from "@vercel/postgres";

export default async function storePayment(
	customerId,
	subscriptionId,
	gatewayId,
	paymentId,
	status,
	campaign,
	amount
) {
	try {
		await sql`
        INSERT INTO payments (
          customer_id, 
          subscription_id, 
          gateway_id, 
          payment_id, 
          status, 
          campaign,
          amount,
          created_at, 
          updated_at
        ) VALUES (
          ${customerId}, 
          ${subscriptionId}, 
          ${gatewayId}, 
          ${paymentId}, 
          ${status}, 
          ${campaign},
          ${amount},
          NOW(),
          NOW()  
        );
      `;
		console.log(`Stored payment: ${paymentId}`);
		return {
			success: true,
		};
	} catch (error) {
		console.error("Error storing payment:", error);
		return {
			success: false,
		};
	}
}
