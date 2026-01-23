import { sql } from "@vercel/postgres";

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
