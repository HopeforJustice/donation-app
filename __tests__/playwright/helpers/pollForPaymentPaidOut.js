import { poll } from "@/app/lib/utilities";
import getProcessedEvent from "@/app/lib/db/getProcessedEvent";
import { getGoCardlessClient } from "@/app/lib/gocardless/gocardlessclient";
const client = getGoCardlessClient();

export default async function pollForPaymentPaidOut(testEmail) {
	return await poll(
		async () => {
			const event = await getProcessedEvent(null, "payments");
			if (!event) return null;
			if (!event.gocardless_customer_id) return null;
			if (event.gocardless_customer_id === "unknown") return null;
			try {
				const customer = await client.customers.find(
					event.gocardless_customer_id
				);
				if (customer.email === testEmail) {
					return { customer, event };
				}
			} catch (err) {
				// Only skip specific error, rethrow others
				if (err.message.includes("This customer data has been removed")) {
					return null;
				}
				throw err;
			}
			return null; // Not found yet, keep polling
		},
		{ interval: 500, timeout: 60000 }
	);
}
