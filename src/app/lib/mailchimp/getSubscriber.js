import getList from "./getList";
import getMailchimpConfig from "./getMailchimpConfig";
import getSubscriberHash from "./getSubscriberHash";

export default async function getSubscriber(email, country = "uk") {
	try {
		const mailchimp = getMailchimpConfig();
		const list = await getList(country);
		const subscriberHash = getSubscriberHash(email);
		const subscriber = await mailchimp.lists.getListMember(
			list.id,
			subscriberHash
		);
		return subscriber;
	} catch (error) {
		throw new Error(`Get subscriber failed, error: ${error.message}`);
	}
}
