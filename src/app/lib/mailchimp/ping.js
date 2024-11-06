import getMailchimpConfig from "./getMailchimpConfig";

export default async function mailchimpPing() {
	const mailchimp = getMailchimpConfig();
	const response = await mailchimp.ping.get();
	return response;
}
