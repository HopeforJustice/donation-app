jest.mock("sparkpost");

const email = "test@example.com";
const firstName = "John";
const amount = "£50.00";

describe("send direct debit confirmation email", () => {
	let mockSend;
	let sendDirectDebitConfirmationEmail;

	beforeEach(() => {
		jest.clearAllMocks();
		jest.resetModules();

		mockSend = jest.fn();

		const SparkPost = require("sparkpost");
		SparkPost.mockImplementation(() => ({
			transmissions: {
				send: mockSend,
			},
		}));

		sendDirectDebitConfirmationEmail = require("@/app/lib/sparkpost/sendDirectDebitConfirmationEmail");
	});

	it("should send a direct debit confirmation email with the correct data", async () => {
		const mockResponse = {
			results: {
				total_rejected_recipients: 0,
				total_accepted_recipients: 1,
				id: "123456789",
			},
		};

		mockSend.mockResolvedValue(mockResponse);

		const result = await sendDirectDebitConfirmationEmail(
			email,
			firstName,
			amount,
		);

		expect(mockSend).toHaveBeenCalledTimes(1);

		const emailData = mockSend.mock.calls[0][0];

		expect(emailData.content.template_id).toBe("uk-regular-gift-confirmation");
		expect(emailData.content.use_draft_template).toBe(false);
		expect(emailData.recipients[0].address.email).toBe(email);
		expect(emailData.recipients[0].substitution_data.name).toBe(firstName);
		expect(emailData.recipients[0].substitution_data.amount).toBe(amount);

		expect(result).toEqual(mockResponse);
	});

	it("should handle send email failure", async () => {
		const consoleErrorSpy = jest
			.spyOn(console, "error")
			.mockImplementation(() => {});

		mockSend.mockResolvedValue(null);

		const result = await sendDirectDebitConfirmationEmail(
			email,
			firstName,
			amount,
		);

		expect(mockSend).toHaveBeenCalledTimes(1);
		expect(result).toBeUndefined();
		expect(consoleErrorSpy).toHaveBeenCalledWith(expect.any(Error));

		consoleErrorSpy.mockRestore();
	});
});
