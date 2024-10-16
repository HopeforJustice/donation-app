import { sql } from "@vercel/postgres";

export default async function cancelSubscription(id) {
	// If the subscription exists, update its status to 'cancelled'
	const updateData = await sql`
    UPDATE subscriptions
    SET status = 'cancelled'
    WHERE id = ${id}
    RETURNING status;
    `;

	if (updateData.rows[0].status) {
		return {
			success: true,
			message: "Cancelled subscription",
		};
	} else {
		return {
			success: false,
			message: "Failed to cancel subscription in db",
		};
	}
}
