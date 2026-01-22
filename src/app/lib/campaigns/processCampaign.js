import freedomFoundation from "./freedomFoundation";
import EOY2025 from "./2025eoy";

export default async function processCampaign(
	campaign,
	formData,
	metadata,
	constituentId,
	currency,
	amount
) {
	switch (campaign) {
		case "FreedomFoundation":
			return await freedomFoundation(
				formData,
				metadata,
				constituentId,
				currency,
				amount
			);
		case "2025 EOY":
			return await EOY2025(metadata, currency, amount);
		// Add more cases for other campaigns as needed
		default:
			console.log(`${campaign} has no specific processing logic defined.`);
	}
}
