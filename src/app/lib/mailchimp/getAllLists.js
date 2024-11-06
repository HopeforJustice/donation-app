import getMailchimpConfig from "./getMailchimpConfig";

export default async function getAllLists() {
	const mailchimp = getMailchimpConfig();
	const response = await mailchimp.lists.getAllLists();
	return response;
}
