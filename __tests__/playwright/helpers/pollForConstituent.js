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

export default async function pollForConstituent(email, donorfyInstance) {
	const donorfy = donorfyInstance === "us" ? donorfyUS : donorfyUK;
	return await poll(
		async () => {
			try {
				const duplicateCheckData = await donorfy.duplicateCheck({
					EmailAddress: email,
				});
				if (
					duplicateCheckData.length > 0 &&
					duplicateCheckData[0].Score >= 15
				) {
					return duplicateCheckData[0].ConstituentId;
				}
			} catch (err) {
				throw err;
			}
			return null;
		},
		{ interval: 500, timeout: 60000 }
	);
}
