const SparkPost = require("sparkpost");
const client = new SparkPost(process.env.SPARKPOST_API_KEY);

async function sendEmailByTemplateName(templateId, sendTo, substitutionData) {
	try {
		const response = await client.transmissions.send({
			content: {
				template_id: templateId,
				use_draft_template: false,
			},

			recipients: [
				{
					address: {
						email: sendTo,
					},
					substitution_data: {
						...substitutionData,
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

module.exports = sendEmailByTemplateName;
