import { sql } from "@vercel/postgres";

export default async function storeWebhookEvent(
	event,
	status,
	additionalNotes,
	constituentId = null,
	goCardlessCustomerId = null,
	donorfyTransactionId = null,
	subscriptionId = null
) {
	const test = process.env.VERCEL_ENV === "production" ? false : true;
	try {
		const eventId = event.id || event.meta?.webhook_id || "unknown_event_id";
		const eventToStore = {
			id: eventId,
			currency: event.currency || event.data?.object?.currency || "unknown",
		};
		const notes = `${additionalNotes}`;

		// Check if event already exists
		const existingEvent = await sql`
			SELECT id FROM processed_events WHERE event_id = ${eventId} LIMIT 1
		`;

		let result;
		if (existingEvent.rows.length > 0) {
			// Update existing event - transition status
			result = await sql`
				UPDATE processed_events
				SET 
					status = ${status},
					notes = ${notes},
					processed_at = NOW(),
					constituent_id = COALESCE(${constituentId}, constituent_id),
					gocardless_customer_id = COALESCE(${goCardlessCustomerId}, gocardless_customer_id),
					donorfy_transaction_id = COALESCE(${donorfyTransactionId}, donorfy_transaction_id),
					subscription_id = COALESCE(${subscriptionId}, subscription_id)
				WHERE event_id = ${eventId}
				RETURNING id;
			`;
			console.log(
				`Updated webhook event: ${eventId} to status '${status}' (row id ${result.rows[0].id})`
			);
		} else {
			// Insert new event
			result = await sql`
				INSERT INTO processed_events (
					event_id, event_type, notes, processed_at, status, event, constituent_id, gocardless_customer_id, test, donorfy_transaction_id, subscription_id
				) VALUES (
					${eventId},
					${event.resource_type || event.type || "webhook"},
					${notes},
					NOW(),
					${status},
					${eventToStore},
					${constituentId},
					${goCardlessCustomerId},
					${test},
					${donorfyTransactionId},
					${subscriptionId}
				)
				RETURNING id;
			`;
			console.log(
				`Stored webhook event: ${eventId} with status '${status}' (row id ${result.rows[0].id})`
			);
		}

		return result.rows[0].id;
	} catch (error) {
		console.error("Error storing webhook event:", error);
		return null;
	}
}
