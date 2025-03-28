import getList from "./getList";
import getMailchimpConfig from "./getMailchimpConfig";
import getSubscriberHash from "./getSubscriberHash";

export default async function deleteTag(email, tag, country = "uk") {
	try {
		const mailchimp = getMailchimpConfig();
		const list = await getList(country);

		const subscriberHash = getSubscriberHash(email);
		console.log(list.id, subscriberHash);

		const response = await mailchimp.lists.updateListMemberTags(
			list.id,
			subscriberHash,
			{
				tags: [{ name: tag, status: "inactive" }],
			}
		);

		console.log("removed subscriber tag", response);

		return { success: true, response };
	} catch (error) {
		console.error("error removing subscriber tag", error);
		return {
			success: false,
			message: "error removing subscriber tag",
			error,
		};
	}
}
