import freedomFoundation from "./freedomFoundation";

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
		// Add more cases for other campaigns as needed
		default:
			console.log(`${campaign} has no specific processing logic defined.`);
	}
}
