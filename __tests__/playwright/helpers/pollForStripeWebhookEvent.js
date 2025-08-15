import { poll } from "@/app/lib/utilities";
import { sql } from "@vercel/postgres";
import { getStripeInstance } from "@/app/lib/stripe/getStripeInstance";

export default async function pollForStripeWebhookEvent(
	email,
	currency,
	eventType = "checkout.session.completed",
	timeout = 60000,
	occurrence = 1 // Which occurrence to look for (1st, 2nd, etc.)
) {
	return await poll(
		async () => {
			try {
				// Get the latest processed webhook event of the specified type
				const query = `
					SELECT *
					FROM processed_events
					WHERE event_type = $1
					AND test = true
					ORDER BY processed_at DESC
					LIMIT 10;
				`;

				const data = await sql.query(query, [eventType]);

				if (data.rows.length > 0) {
					const matchingEvents = [];

					// Check each recent event to see if it matches our test email
					for (const row of data.rows) {
						try {
							// Parse the event_id from the stored event data
							const eventId = row.event_id;

							if (!eventId || eventId === "unknown_event_id") {
								continue;
							}

							// Get the correct Stripe instance based on currency
							const stripeClient = getStripeInstance({
								currency,
								mode: "test",
							});

							// Try to retrieve the event from the correct Stripe account
							try {
								const stripeEvent = await stripeClient.events.retrieve(eventId);

								if (stripeEvent && stripeEvent.type === eventType) {
									let emailMatch = false;

									// Handle different event types
									switch (eventType) {
										case "checkout.session.completed":
											const session = stripeEvent.data.object;
											emailMatch = session.customer_details?.email === email;
											break;

										case "customer.subscription.created":
										case "customer.subscription.updated":
										case "customer.subscription.deleted":
											const subscription = stripeEvent.data.object;
											// Get customer details from Stripe
											try {
												const customer = await stripeClient.customers.retrieve(
													subscription.customer
												);
												emailMatch = customer.email === email;
											} catch (customerError) {
												console.log(
													`Error retrieving customer for subscription: ${customerError.message}`
												);
												continue;
											}
											break;

										case "invoice.payment_succeeded":
										case "invoice.payment_failed":
										case "invoice.created":
										case "invoice.finalized":
											const invoice = stripeEvent.data.object;
											// Get customer details from Stripe
											try {
												const customer = await stripeClient.customers.retrieve(
													invoice.customer
												);
												emailMatch = customer.email === email;
											} catch (customerError) {
												console.log(
													`Error retrieving customer for invoice: ${customerError.message}`
												);
												continue;
											}
											break;

										default:
											console.log(
												`Event type ${eventType} not yet supported for email matching`
											);
											continue;
									}

									if (emailMatch) {
										matchingEvents.push({
											...row,
											stripeEvent,
											stripeClient,
										});
									}
								}
							} catch (stripeError) {
								console.log(
									`Event ${eventId} not found in ${currency.toUpperCase()} Stripe account:`,
									stripeError.message
								);
								continue;
							}
						} catch (eventError) {
							console.log(
								`Error checking event ${row.event_id}:`,
								eventError.message
							);
							continue;
						}
					}

					// Return the requested occurrence (1st, 2nd, etc.)
					if (matchingEvents.length >= occurrence) {
						const requestedEvent = matchingEvents[occurrence - 1];
						return requestedEvent;
					}
				}
			} catch (err) {
				console.error("Error polling for webhook event:", err);
				throw err;
			}
			return null;
		},
		{ interval: 1000, timeout } // Use the provided timeout
	);
}
