import { poll } from "@/app/lib/utilities";
import DonorfyClient from "@/app/lib/donorfy/donorfyClient";
const donorfyUK = new DonorfyClient(
	process.env.DONORFY_UK_KEY,
	process.env.DONORFY_UK_TENANT
);

const donorfyUS = new DonorfyClient(
	process.env.DONORFY_US_KEY,
	process.env.DONORFY_US_TENANT
);

export default async function pollForActivityType(
	constituentId,
	activityType,
	currency = "gbp"
) {
	const donorfy = currency === "usd" ? donorfyUS : donorfyUK;
	console.log(`polling for ${activityType} on constituent:${constituentId}`);
	return await poll(
		async () => {
			try {
				const activities = await donorfy.getConstituentActivities(
					constituentId
				);

				for (const activity of activities.ActivitiesList) {
					if (activity.ActivityType === activityType) {
						return activity;
					}
				}
			} catch (err) {
				throw err;
			}
			return null;
		},
		{ interval: 500, timeout: 60000 }
	);
}
