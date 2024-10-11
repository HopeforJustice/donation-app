import { sql } from "@vercel/postgres";

export default async function storeWebhookEvent(
	event,
	gatewayId,
	additionalNotes
) {
	try {
		const eventId = event.id;
		const eventDetails = JSON.stringify(event); // Convert event object to JSON string
		const notes = `${additionalNotes} Event Details: ${eventDetails}`; // Concatenate the notes and event details

		await sql`
        INSERT INTO processed_events (
          event_id, gateway_id, event_type, notes, processed_at
        ) VALUES (
          ${eventId}, ${gatewayId}, ${event.resource_type}, ${notes}, NOW()
        );
      `;
		console.log(`Stored webhook event: ${eventId}`);
	} catch (error) {
		console.error("Error storing webhook event:", error);
	}
}
