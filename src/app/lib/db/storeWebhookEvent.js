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
	additionalNotes,
	constituentId = null,
	goCardlessCustomerId = null
) {
	const test = process.env.GOCARDLESS_ENVIRONMENT === "live" ? false : true;
	try {
		const eventId = event.id || event.meta?.webhook_id;
		const notes = `${additionalNotes}`; // Concatenate the notes and event details

		await sql`
        INSERT INTO processed_events (
          event_id, event_type, notes, processed_at, status, event, constituent_id, gocardless_customer_id, test
        ) VALUES (
          ${eventId}, ${
			event.resource_type || event.type || "webhook"
		}, ${notes}, NOW(), ${status}, ${event}, 
		  ${constituentId}, ${goCardlessCustomerId}, ${test}
        );
      `;
		console.log(`Stored webhook event: ${eventId}`);
	} catch (error) {
		console.error("Error storing webhook event:", error);
	}
}
