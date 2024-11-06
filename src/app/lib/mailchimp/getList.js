import getMailchimpConfig from "./getMailchimpConfig";

export default async function getList(country = "uk") {
	const mailchimp = getMailchimpConfig();
	//will need to add more options for other lists/countries in the future
	let id;
	if (country === "uk") {
		id = process.env.MC_UK_AUDIENCE_ID;
	}

	const response = await mailchimp.lists.getList(id);
	return response;
}
