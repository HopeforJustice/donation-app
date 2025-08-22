import { sql } from "@vercel/postgres";

export default async function getProcessedEvent(
	id = null,
	eventType = null,
	limit = 1
) {
	if (id) {
		const data = await sql`
			SELECT *
			FROM processed_events
			WHERE id = ${id}
			LIMIT ${limit};
		`;
		if (limit > 1 && data.rows.length > 0) {
			return data.rows;
		}
		if (data.rows.length > 0) {
			return data.rows[0];
		}
	} else if (eventType) {
		const data = await sql`
			SELECT *
			FROM processed_events
			WHERE event_type = ${eventType}
			ORDER BY processed_at DESC
			LIMIT ${limit};
		`;
		if (limit > 1 && data.rows.length > 0) {
			return data.rows;
		}
		if (data.rows.length > 0) {
			return data.rows[0];
		}
	}
	return "not found";
}
