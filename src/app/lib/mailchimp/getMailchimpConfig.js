const mailchimp = require("@mailchimp/mailchimp_marketing");

export default function getMailchimpConfig() {
	mailchimp.setConfig({
		apiKey: process.env.MC_API_KEY,
		server: "us19",
	});

	return mailchimp;
}
