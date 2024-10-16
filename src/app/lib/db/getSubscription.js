import { sql } from "@vercel/postgres";

export default async function getSubscription(id) {
	const data = await sql`
        SELECT * FROM subscriptions WHERE subscription_id = ${id};
    `;

	if (data.rows.length > 0) {
		return data;
	}

	return false;
}
