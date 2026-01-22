jest.mock("sparkpost");

const error = {
	message: "Error message",
	stack: "Error stack trace",
};
const additionalInfo = {
	userId: 12345,
};

describe("send error email unit test", () => {
	let mockSend;

	beforeEach(() => {
		jest.clearAllMocks();
		jest.resetModules();

		mockSend = jest.fn();
		mockSend.mockResolvedValue(true);

		const SparkPost = require("sparkpost");
		SparkPost.mockImplementation(() => ({
			transmissions: {
				send: mockSend,
			},
		}));
	});

	it("should send an error email with TEST in subject", async () => {
		process.env.VERCEL_ENV = "test";

		const sendErrorEmail = require("@/app/lib/sparkpost/sendErrorEmail");

		await sendErrorEmail(error, additionalInfo);

		expect(mockSend).toHaveBeenCalledTimes(1);

		const emailData = mockSend.mock.calls[0][0];

		expect(emailData.content.subject).toBe(
			"TEST: Error Occurred in Donation App",
		);
		expect(emailData.content.html).toContain("Error message");
		expect(emailData.content.html).toContain('"userId": 12345');
	});

	it("should send an error email with LIVE in subject", async () => {
		process.env.VERCEL_ENV = "production";
		const sendErrorEmail = require("@/app/lib/sparkpost/sendErrorEmail");

		await sendErrorEmail(error, additionalInfo);

		expect(mockSend).toHaveBeenCalledTimes(1);

		const emailData = mockSend.mock.calls[0][0];

		expect(emailData.content.subject).toBe(
			"LIVE: Error Occurred in Donation App",
		);
		expect(emailData.content.html).toContain("Error message");
		expect(emailData.content.html).toContain('"userId": 12345');
	});
	it("should handle send email failure", async () => {
		process.env.VERCEL_ENV = "test";
		mockSend.mockResolvedValue(null); // Simulate failure

		const consoleErrorSpy = jest
			.spyOn(console, "error")
			.mockImplementation(() => {});

		const sendErrorEmail = require("@/app/lib/sparkpost/sendErrorEmail");

		await sendErrorEmail(error, additionalInfo);

		expect(mockSend).toHaveBeenCalledTimes(1);
		expect(consoleErrorSpy).toHaveBeenCalledWith(
			new Error("failed to send email"),
		);

		consoleErrorSpy.mockRestore();
	});
});
