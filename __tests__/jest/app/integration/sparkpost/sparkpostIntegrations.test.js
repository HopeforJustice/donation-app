import sendErrorEmail from "@/app/lib/sparkpost/sendErrorEmail";
import sendDirectDebitConfirmationEmail from "@/app/lib/sparkpost/sendDirectDebitConfirmationEmail";

/* example results:
      results: {
        total_rejected_recipients: 0,
        total_accepted_recipients: 1,
        id: '7598152894470166888'
      }
*/

describe("Sparkpost Integrations", () => {
	it("should send an error email", async () => {
		const error = {
			message: "Test error message",
			stack: "Error stack trace",
		};
		const additionalInfo = {
			userId: 12345,
			action: "Testing error email",
		};
		const response = await sendErrorEmail(error, additionalInfo);
		expect(response.results).toBeDefined();
		expect(response.results.total_accepted_recipients).toBe(1);
	});
	it("should send an error email without additional info", async () => {
		const error = {
			message: "Test error message without additional info",
			stack: "Error stack trace",
		};
		const response = await sendErrorEmail(error);
		expect(response.results).toBeDefined();
		expect(response.results.total_accepted_recipients).toBe(1);
	});
	it("should send a Direct Debit Confirmation email", async () => {
		const email = "james.holt@hopeforjustice.org";
		const firstName = "James";
		const amount = "25.00";

		const response = await sendDirectDebitConfirmationEmail(
			email,
			firstName,
			amount,
		);

		expect(response.results).toBeDefined();
		expect(response.results.total_accepted_recipients).toBe(1);
	});
});
