jest.mock("sparkpost");

const templateId = "test-template-id";
const sendTo = "test@test.com";
const substitutionData = {
	name: "Test",
	amount: "£50.00",
};

describe("send email by template name", () => {
	let mockSend;
	let sendEmailByTemplateName;

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

		sendEmailByTemplateName = require("@/app/lib/sparkpost/sendEmailByTemplateName");
	});

	it("should send an email with the data passed via parameters", async () => {
		mockSend.mockResolvedValue(true);
		await sendEmailByTemplateName(templateId, sendTo, substitutionData);

		expect(mockSend).toHaveBeenCalledTimes(1);

		const emailData = mockSend.mock.calls[0][0];

		expect(emailData.content.template_id).toBe("test-template-id");
		expect(emailData.recipients[0].address.email).toBe(sendTo);
		expect(emailData.recipients[0].substitution_data).toEqual(substitutionData);
	});

	it("should handle throw an error if no response", async () => {
		const consoleErrorSpy = jest
			.spyOn(console, "error")
			.mockImplementation(() => {});

		mockSend.mockResolvedValue(null); // no response

		await sendEmailByTemplateName(templateId, sendTo, substitutionData);

		expect(mockSend).toHaveBeenCalledTimes(1);
		expect(consoleErrorSpy).toHaveBeenCalledWith(expect.any(Error));

		consoleErrorSpy.mockRestore();
	});
});
