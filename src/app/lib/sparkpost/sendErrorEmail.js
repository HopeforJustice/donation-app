const SparkPost = require("sparkpost");
const client = new SparkPost(process.env.SPARKPOST_API_KEY);
const test = process.env.VERCEL_ENV !== "production";

async function sendErrorEmail(error, additionalInfo = {}, test = false) {
	try {
		const response = await client.transmissions.send({
			content: {
				from: "donation-app@hopeforjustice.org",
				subject: `${test ? "TEST:" : "LIVE:"} Error Occurred in Donation App`,
				html: `<p><strong>Info:</strong> ${JSON.stringify(
					additionalInfo,
					null,
					2
				)}</p>
               <pre>${error.message}</pre>
               <pre>${error.stack}</pre>`,
			},
			recipients: [{ address: "james.holt@hopeforjustice.org" }],
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

module.exports = sendErrorEmail;
