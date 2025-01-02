/*
 * StoreWebhookEvent.js
 * Store events from webhooks
 * Also stores failed webhooks
 *
 */

import { sql } from "@vercel/postgres";

export default async function storeWebhookEvent(
	event,
	status,
	additionalNotes
) {
	try {
		const eventId = event.id || event.meta?.webhook_id;
		const notes = `${additionalNotes}`; // Concatenate the notes and event details

		await sql`
        INSERT INTO processed_events (
          event_id, event_type, notes, processed_at, status, event
        ) VALUES (
          ${eventId}, ${
			event.resource_type || event.type || "webhook"
		}, ${notes}, NOW(), ${status}, ${event}
        );
      `;
		console.log(`Stored webhook event: ${eventId}`);
	} catch (error) {
		console.error("Error storing webhook event:", error);
	}
}
