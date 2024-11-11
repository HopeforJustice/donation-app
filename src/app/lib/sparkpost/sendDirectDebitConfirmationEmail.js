const SparkPost = require("sparkpost");
const client = new SparkPost(process.env.SPARKPOST_API_KEY);

async function sendDirectDebitConfirmationEmail(email, firstName, amount) {
	try {
		const response = await client.transmissions.send({
			content: {
				template_id: "uk-regular-gift-confirmation",
				use_draft_template: false,
			},

			recipients: [
				{
					address: {
						email: email,
					},
					substitution_data: {
						name: firstName,
						amount: amount,
					},
				},
			],
		});

		if (response) {
			return response;
		} else {
			throw new Error("failed to send email");
		}
	} catch (emailError) {
		console.error(emailError);
	}
}

module.exports = sendDirectDebitConfirmationEmail;
