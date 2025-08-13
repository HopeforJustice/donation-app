import { sql } from "@vercel/postgres";

export default async function storeWebhookEvent(
	event,
	status,
	additionalNotes,
	constituentId = null,
	goCardlessCustomerId = null,
	donorfyTransactionId = null
) {
	const test = process.env.VERCEL_ENV === "production" ? false : true;
	try {
		const eventId = event.id || event.meta?.webhook_id || "unknown_event_id";
		const notes = `${additionalNotes}`;
		const result = await sql`
			INSERT INTO processed_events (
				event_id, event_type, notes, processed_at, status, event, constituent_id, gocardless_customer_id, test, donorfy_transaction_id
			) VALUES (
				${eventId},
				${event.resource_type || event.type || "webhook"},
				${notes},
				NOW(),
				${status},
				${JSON.stringify(eventId)},
				${constituentId},
				${goCardlessCustomerId},
				${test},
				${donorfyTransactionId}
			)
			RETURNING id;
		`;

		console.log(
			`Stored webhook event: ${eventId} (row id ${result.rows[0].id})`
		);
		return result.rows[0].id; // Return the inserted row id
	} catch (error) {
		console.error("Error storing webhook event:", error);
		return null; // You can throw error or return null based on your use case
	}
}
