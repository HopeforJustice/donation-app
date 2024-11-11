const SparkPost = require("sparkpost");
const client = new SparkPost(process.env.SPARKPOST_API_KEY);

async function sendErrorEmail(error, additionalInfo = {}) {
	try {
		const response = await client.transmissions.send({
			content: {
				from: "donation-app@hopeforjustice.org", // Replace with your verified sender email
				subject: "Error Occurred in Donation App",
				html: `<p><strong>Info:</strong> ${JSON.stringify(
					additionalInfo,
					null,
					2
				)}</p>
               <pre>${error.message}</pre>
               <pre>${error.stack}</pre>`, // Include error message and stack trace
			},
			recipients: [{ address: "james.holt@hopeforjustice.org" }], // Your notification email
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
