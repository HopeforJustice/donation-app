import { sql } from "@vercel/postgres";

export default async function getConstituentIdFromCustomerID(id) {
	let constituentId;

	const customerData = await sql`
        SELECT donorfy_constituent_id FROM customers WHERE id = ${id};
    `;

	if (customerData) {
		constituentId = customerData.rows[0].donorfy_constituent_id;
	}

	return constituentId;
}
