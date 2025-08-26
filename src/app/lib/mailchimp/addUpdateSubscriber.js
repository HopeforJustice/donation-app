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

		const memberData = {
			email_address: email,
			status_if_new: status,
			merge_fields: {
				FNAME: firstname,
				LNAME: lastname,
				...additionalMergeFields,
			},
			interests,
		};

		const result = await mailchimp.lists.setListMember(
			list.id,
			subscriberHash,
			memberData
		);
		return result;
	} catch (error) {
		console.error("Detailed Mailchimp error:", {
			message: error.message,
			status: error.status,
			detail: error.detail,
			title: error.title,
			type: error.type,
			instance: error.instance,
			response: error.response?.text || error.response?.body,
		});

		// Parse the response to get more detailed error information
		let errorDetail = "";
		try {
			if (error.response?.text || error.response?.body) {
				const responseText = error.response?.text || error.response?.body;
				const parsedResponse = JSON.parse(responseText);
				errorDetail = parsedResponse.detail || "";
			}
		} catch (parseError) {
			// If we can't parse the response, use the original error
		}

		// Check for rate limiting error
		if (errorDetail.includes("signed up to a lot of lists very recently")) {
			console.warn("Mailchimp rate limiting detected");
			// You might want to return a success status here or handle it differently
			// For now, we'll still throw but with a clearer message
			throw new Error(
				`Mailchimp rate limiting, the email has been added to lists too frequently. Please try again later.`
			);
		}

		throw new Error(
			`Add/Update Mailchimp subscriber failed, error: ${error.message}${
				errorDetail ? ` - ${errorDetail}` : ""
			}`
		);
	}
}
