import { sql } from "@vercel/postgres";

export default async function getProcessedEvent(id = null, eventType = null) {
	if (id) {
		const data = await sql`
			SELECT *
			FROM processed_events
			WHERE id = ${id}
			LIMIT 1;
		`;
		if (data.rows.length > 0) {
			return data.rows[0];
		}
	} else if (eventType) {
		const data = await sql`
			SELECT *
			FROM processed_events
			WHERE event_type = ${eventType}
			ORDER BY processed_at DESC
			LIMIT 1;
		`;
		if (data.rows.length > 0) {
			return data.rows[0];
		}
	}
	return "not found";
}
