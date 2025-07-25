import getList from "./getList";
import getMailchimpConfig from "./getMailchimpConfig";
import getSubscriberHash from "./getSubscriberHash";

export default async function deleteTag(email, tag, country = "uk") {
	try {
		const mailchimp = getMailchimpConfig();
		const list = await getList(country);

		const subscriberHash = getSubscriberHash(email);
		console.log(list.id, subscriberHash);

		await mailchimp.lists.updateListMemberTags(list.id, subscriberHash, {
			tags: [{ name: tag, status: "inactive" }],
		});
	} catch (error) {
		throw new Error(
			`Delete Tag from Mailchimp subscriber failed, tag: ${tag}, error: ${error.message}`
		);
	}
}
