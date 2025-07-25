import { sql } from "@vercel/postgres";

export default async function getLatestTestWebhookEvent(time) {
	const data = await sql`
		SELECT *
		FROM processed_events
		ORDER BY processed_at DESC
		LIMIT 1;
	`;
	if (data.rows.length > 0) {
		return data.rows[0];
	} else {
		return "not found";
	}
}
/*


export default async function checkProcessedEvents(eventId) {
	let eventProcessed = false;

	const data = await sql`
    SELECT id FROM processed_events WHERE event_id = ${eventId};
  `;

	if (data.rows.length > 0) {
		eventProcessed = true;
		console.log("event already processed");
	}

	return eventProcessed;
}
*/
