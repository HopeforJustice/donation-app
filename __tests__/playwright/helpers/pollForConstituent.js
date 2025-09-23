import { poll } from "@/app/lib/utilities";
import { getDonorfyClient } from "@/app/lib/utils/apiUtils";

const donorfyUK = getDonorfyClient("uk");
const donorfyUS = getDonorfyClient("us");

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
