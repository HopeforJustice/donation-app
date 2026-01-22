// Mock dependencies
jest.mock("@/app/lib/gocardless/gocardlessclient");
jest.mock("@/app/lib/utils");

describe("handlePaymentFailed", () => {
	let consoleLogSpy, consoleErrorSpy;
	let mockClient, mockDonorfy;
	let handlePaymentFailed;

	beforeEach(() => {
		jest.resetModules();
		consoleLogSpy = jest.spyOn(console, "log").mockImplementation();
		consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

		mockClient = {
			payments: {
				find: jest.fn(),
			},
			mandates: {
				find: jest.fn(),
			},
			customers: {
				find: jest.fn(),
			},
		};

		mockDonorfy = {
			addActivity: jest.fn(),
		};

		const {
			getGoCardlessClient,
		} = require("@/app/lib/gocardless/gocardlessclient");
		getGoCardlessClient.mockReturnValue(mockClient);

		const { getDonorfyClient } = require("@/app/lib/utils");
		getDonorfyClient.mockReturnValue(mockDonorfy);

		process.env.VERCEL_ENV = "production";

		const {
			handlePaymentFailed: importedFunction,
		} = require("@/app/lib/webhookHandlers/goCardless/handlePaymentFailed");
		handlePaymentFailed = importedFunction;
	});

	afterEach(() => {
		jest.clearAllMocks();
		consoleLogSpy.mockRestore();
		consoleErrorSpy.mockRestore();
		delete process.env.VERCEL_ENV;
	});

	it("should process failed payment for subscription", async () => {
		const event = {
			links: { payment: "PM123" },
		};

		const payment = {
			amount: 5000,
			links: {
				subscription: "SB123",
				mandate: "MD123",
			},
		};

		const mandate = {
			links: { customer: "CU123" },
		};

		const customer = {
			id: "CU123",
			metadata: { donorfyConstituentId: "CON123" },
		};

		mockClient.payments.find.mockResolvedValue(payment);
		mockClient.mandates.find.mockResolvedValue(mandate);
		mockClient.customers.find.mockResolvedValue(customer);
		mockDonorfy.addActivity.mockResolvedValue(true);

		const result = await handlePaymentFailed(event);

		expect(result.status).toBe(200);
		expect(result.eventStatus).toBe("processed");
		expect(result.constituentId).toBe("CON123");
		expect(mockDonorfy.addActivity).toHaveBeenCalledWith({
			ActivityType: "Gocardless Payment Failed",
			Notes: "Amount: 50",
			Number1: 50,
			ExistingConstituentId: "CON123",
		});
	});

	it("should skip non-subscription payments in production", async () => {
		const event = {
			links: { payment: "PM123" },
		};

		const payment = {
			amount: 5000,
			links: {
				subscription: null,
				mandate: "MD123",
			},
		};

		const mandate = {
			links: { customer: "CU123" },
		};

		const customer = {
			id: "CU123",
			metadata: { donorfyConstituentId: "CON123" },
		};

		mockClient.payments.find.mockResolvedValue(payment);
		mockClient.mandates.find.mockResolvedValue(mandate);
		mockClient.customers.find.mockResolvedValue(customer);

		const result = await handlePaymentFailed(event);

		expect(result.status).toBe(200);
		expect(result.eventStatus).toBe("N/A");
		expect(mockDonorfy.addActivity).not.toHaveBeenCalled();
	});

	it("should process non-subscription payments in test environment", async () => {
		process.env.VERCEL_ENV = "development";
		jest.resetModules();

		// Re-setup mocks after resetModules
		const {
			getGoCardlessClient,
		} = require("@/app/lib/gocardless/gocardlessclient");
		getGoCardlessClient.mockReturnValue(mockClient);

		const { getDonorfyClient } = require("@/app/lib/utils");
		getDonorfyClient.mockReturnValue(mockDonorfy);

		const {
			handlePaymentFailed: testHandlePaymentFailed,
		} = require("@/app/lib/webhookHandlers/goCardless/handlePaymentFailed");

		const event = {
			links: { payment: "PM123" },
		};

		const payment = {
			amount: 5000,
			links: {
				subscription: null,
				mandate: "MD123",
			},
		};

		const mandate = {
			links: { customer: "CU123" },
		};

		const customer = {
			id: "CU123",
			metadata: { donorfyConstituentId: "CON123" },
		};

		mockClient.payments.find.mockResolvedValue(payment);
		mockClient.mandates.find.mockResolvedValue(mandate);
		mockClient.customers.find.mockResolvedValue(customer);
		mockDonorfy.addActivity.mockResolvedValue(true);

		const result = await testHandlePaymentFailed(event);

		expect(result.eventStatus).toBe("processed");
		expect(mockDonorfy.addActivity).toHaveBeenCalled();
	});

	it("should handle missing constituent ID", async () => {
		const event = {
			links: { payment: "PM123" },
		};

		const payment = {
			amount: 5000,
			links: {
				subscription: "SB123",
				mandate: "MD123",
			},
		};

		const mandate = {
			links: { customer: "CU123" },
		};

		const customer = {
			id: "CU123",
			metadata: {},
		};

		mockClient.payments.find.mockResolvedValue(payment);
		mockClient.mandates.find.mockResolvedValue(mandate);
		mockClient.customers.find.mockResolvedValue(customer);
		mockDonorfy.addActivity.mockResolvedValue(true);

		const result = await handlePaymentFailed(event);

		expect(result.constituentId).toBe(null);
		expect(mockDonorfy.addActivity).toHaveBeenCalledWith(
			expect.objectContaining({
				ExistingConstituentId: null,
			}),
		);
	});

	it("should throw error with context on failure", async () => {
		const event = {
			links: { payment: "PM123" },
		};

		mockClient.payments.find.mockRejectedValue(new Error("API error"));

		await expect(handlePaymentFailed(event)).rejects.toThrow();
		expect(consoleErrorSpy).toHaveBeenCalled();
	});
});
