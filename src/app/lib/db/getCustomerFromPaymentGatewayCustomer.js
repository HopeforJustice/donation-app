import { sql } from "@vercel/postgres";

export default async function getCustomerFromPaymentGatewayCustomer(
	gatewayCustomerId
) {
	const gatewayCustomerData = await sql`
        SELECT customer_id FROM payment_gateway_customers WHERE gateway_customer_id = ${gatewayCustomerId};
    `;

	if (gatewayCustomerData) {
		const customerId = gatewayCustomerData.rows[0].customer_id;
		const customer = await sql`
            SELECT * FROM customers WHERE id = ${customerId};
        `;
		return customer;
	}
	return false;
}
