import { poll } from "@/app/lib/utilities";
import getProcessedEvent from "@/app/lib/db/getProcessedEvent";
import { getDonorfyClient } from "@/app/lib/utils/apiUtils";

export default async function pollForPayPalEvent(testEmail) {
	return await poll(
		async () => {
			const events = await getProcessedEvent(null, "paypal_donation", 5);
			if (events.length === 0) return null;

			for (const event of events) {
				if (!event.id) return null;
				// Select appropriate Donorfy client based on currency
				let donorfy;
				switch (event.event.currency) {
					case "usd":
						donorfy = getDonorfyClient("us");
						break;
					case "nok":
						donorfy = getDonorfyClient("nok");
						break;
					default:
						donorfy = getDonorfyClient("uk");
				}

				try {
					const constituent = await donorfy.getConstituent(
						event.constituent_id
					);
					if (constituent.EmailAddress === testEmail) {
						return event;
					}
				} catch (err) {
					return null;
				}
				return null;
			}
		},
		{ interval: 500, timeout: 60000 }
	);
}
