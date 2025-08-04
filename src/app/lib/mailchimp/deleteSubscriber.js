import getList from "./getList";
import getMailchimpConfig from "./getMailchimpConfig";
import getSubscriberHash from "./getSubscriberHash";

export default async function deleteSubscriber(email, country = "uk") {
	try {
		const mailchimp = getMailchimpConfig();
		const list = await getList(country);
		const subscriberHash = getSubscriberHash(email);
		const result = await mailchimp.lists.deleteListMemberPermanent(
			list.id,
			subscriberHash
		);
		return result;
	} catch (error) {
		throw new Error(`Delete subscriber failed, error: ${error.message}`);
	}
}
