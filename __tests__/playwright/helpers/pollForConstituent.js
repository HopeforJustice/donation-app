import { poll } from "@/app/lib/utilities";
import { getDonorfyClient } from "@/app/lib/utils/apiUtils";

const donorfy = getDonorfyClient("sandbox");

export default async function pollForConstituent(email, donorfyInstance) {
	return await poll(
		async () => {
			try {
				const duplicateCheckData = await donorfy.duplicateCheck({
					EmailAddress: email,
				});
				console.log(
					`Duplicate check results for ${email}:`,
					duplicateCheckData
				);
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
