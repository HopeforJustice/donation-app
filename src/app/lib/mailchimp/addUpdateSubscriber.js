import getList from "./getList";
import getMailchimpConfig from "./getMailchimpConfig";
import getSubscriberHash from "./getSubscriberHash";

export default async function addUpdateSubscriber(
	email,
	firstname,
	lastname,
	status,
	country = "uk",
	additionalMergeFields = {}
) {
	try {
		const mailchimp = getMailchimpConfig();
		const list = await getList(country);

		const subscriberHash = getSubscriberHash(email);

		//email updates interests

		//these are difficult to find, you have to use the api
		let interests = {};
		if (country === "uk") {
			interests = { "60a2c211ce": true };
		} else if (country === "us") {
			interests = { b90c533e0c: true };
		}

		await mailchimp.lists.setListMember(list.id, subscriberHash, {
			email_address: email,
			status_if_new: status,
			merge_fields: {
				FNAME: firstname,
				LNAME: lastname,
				...additionalMergeFields,
			},
			interests,
		});
	} catch (error) {
		throw new Error(
			`Add/Update Mailchimp subscriber failed, error: ${error.message}`
		);
	}
}
