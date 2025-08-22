import { poll } from "@/app/lib/utilities";
import getProcessedEvent from "@/app/lib/db/getProcessedEvent";
import DonorfyClient from "@/app/lib/donorfy/donorfyClient";

const donorfyUK = new DonorfyClient(
	process.env.DONORFY_UK_KEY,
	process.env.DONORFY_UK_TENANT
);

const donorfyUS = new DonorfyClient(
	process.env.DONORFY_US_KEY,
	process.env.DONORFY_US_TENANT
);

export default async function pollForPayPalEvent(testEmail) {
	return await poll(
		async () => {
			const events = await getProcessedEvent(null, "paypal_donation", 5);
			if (events.length === 0) return null;

			for (const event of events) {
				if (!event.id) return null;
				const donorfy = event.event.currency === "usd" ? donorfyUS : donorfyUK;
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
