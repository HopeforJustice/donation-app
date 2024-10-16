import { sql } from "@vercel/postgres";

export default async function getCustomerFromId(id) {
	const customerData = await sql`
        SELECT * FROM customers WHERE id = ${id};
    `;

	if (customerData.rows.length > 0 && customerData.rows[0].id) {
		return customerData;
	}
	return false;
}
