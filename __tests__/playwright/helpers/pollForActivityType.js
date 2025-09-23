import { poll } from "@/app/lib/utilities";
import { getDonorfyClient } from "@/app/lib/utils/apiUtils";

const donorfyUK = getDonorfyClient("uk");
const donorfyUS = getDonorfyClient("us");

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
