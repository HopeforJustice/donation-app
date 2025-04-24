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
		// console.log(list.id, subscriberHash);

		//email updates interests
		//these are difficult to find, you have to use the api
		let interests = {};
		if (country === "uk") {
			interests = { "60a2c211ce": true };
		} else if (country === "us") {
			interests = { b90c533e0c: true };
		}

		const response = await mailchimp.lists.setListMember(
			list.id,
			subscriberHash,
			{
				email_address: email,
				status_if_new: status,
				merge_fields: {
					FNAME: firstname,
					LNAME: lastname,
					...additionalMergeFields,
				},
				interests,
			}
		);

		console.log("added/updated subscriber in mailchimp");

		return { success: true, response };
	} catch (error) {
		console.error("error adding/updating subscriber", error);
		return {
			success: false,
			message: "Error adding/updating subscriber",
			error,
		};
	}
}
