import { poll } from "@/app/lib/utilities";
import getProcessedEvent from "@/app/lib/db/getProcessedEvent";
import { getGoCardlessClient } from "@/app/lib/gocardless/gocardlessclient";
const client = getGoCardlessClient();

export default async function pollForBillingRequest(testEmail) {
	return await poll(
		async () => {
			const event = await getProcessedEvent(null, "billing_requests");
			if (!event) return null;
			try {
				const customer = await client.customers.find(
					event.event.links.customer
				);
				if (customer.email === testEmail) {
					return { customer, event };
				}
			} catch (err) {
				if (err.message.includes("This customer data has been removed")) {
					return null;
				}
				throw err;
			}
			return null;
		},
		{ interval: 500, timeout: 60000 }
	);
}
