// Mock dependencies
jest.mock("@/app/lib/gocardless/gocardlessclient");
jest.mock("@/app/lib/utils");

describe("handlePaymentPaidOut", () => {
	let consoleLogSpy, consoleErrorSpy;
	let mockClient, mockDonorfy;
	let handlePaymentPaidOut;

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
			createTransaction: jest.fn(),
		};

		const { getDonorfyClient } = require("@/app/lib/utils");
		getDonorfyClient.mockReturnValue(mockDonorfy);

		process.env.VERCEL_ENV = "production";

		const {
			handlePaymentPaidOut: importedFunction,
		} = require("@/app/lib/webhookHandlers/goCardless/handlePaymentPaidOut");
		handlePaymentPaidOut = importedFunction;
	});

	afterEach(() => {
		jest.clearAllMocks();
		consoleLogSpy.mockRestore();
		consoleErrorSpy.mockRestore();
		delete process.env.VERCEL_ENV;
	});

	it("should create transaction for subscription payment", async () => {
		const event = {
			links: { payment: "PM123" },
		};

		const payment = {
			id: "PM123",
			amount: 5000,
			charge_date: "2026-01-22",
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
			metadata: {
				donorfyConstituentId: "CON123",
				additionalDetails: JSON.stringify({
					campaign: "TestCampaign",
					utmSource: "google",
					utmMedium: "cpc",
					utmCampaign: "spring2026",
				}),
			},
		};

		const {
			getGoCardlessClient,
		} = require("@/app/lib/gocardless/gocardlessclient");
		getGoCardlessClient.mockReturnValue(mockClient);

		mockClient.payments.find.mockResolvedValue(payment);
		mockClient.mandates.find.mockResolvedValue(mandate);
		mockClient.customers.find.mockResolvedValue(customer);
		mockDonorfy.createTransaction.mockResolvedValue({ Id: "TRX123" });

		const result = await handlePaymentPaidOut(event);

		expect(result.status).toBe(200);
		expect(result.eventStatus).toBe("processed");
		expect(result.donorfyTransactionId).toBe("TRX123");
		expect(mockDonorfy.createTransaction).toHaveBeenCalledWith(
			50,
			"TestCampaign",
			"GoCardless DD",
			"CON123",
			"2026-01-22",
			"Unrestricted",
			"google",
			"cpc",
			"spring2026",
		);
	});

	it("should use default campaign when not provided", async () => {
		const event = {
			links: { payment: "PM123" },
		};

		const payment = {
			id: "PM123",
			amount: 5000,
			charge_date: "2026-01-22",
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
			metadata: {
				donorfyConstituentId: "CON123",
				additionalDetails: JSON.stringify({}),
			},
		};

		const {
			getGoCardlessClient,
		} = require("@/app/lib/gocardless/gocardlessclient");
		getGoCardlessClient.mockReturnValue(mockClient);

		mockClient.payments.find.mockResolvedValue(payment);
		mockClient.mandates.find.mockResolvedValue(mandate);
		mockClient.customers.find.mockResolvedValue(customer);
		mockDonorfy.createTransaction.mockResolvedValue({ Id: "TRX123" });

		await handlePaymentPaidOut(event);

		expect(mockDonorfy.createTransaction).toHaveBeenCalledWith(
			expect.any(Number),
			"Donation App General Campaign",
			expect.any(String),
			expect.any(String),
			expect.any(String),
			expect.any(String),
			"unknown",
			"unknown",
			"unknown",
		);
	});

	it("should skip non-subscription payments in production", async () => {
		const event = {
			links: { payment: "PM123" },
		};

		const payment = {
			id: "PM123",
			amount: 5000,
			charge_date: "2026-01-22",
			links: {
				subscription: null,
				mandate: "MD123",
			},
		};

		const mandate = {
			links: { customer: "CU123" },
		};

		const {
			getGoCardlessClient,
		} = require("@/app/lib/gocardless/gocardlessclient");
		getGoCardlessClient.mockReturnValue(mockClient);

		mockClient.payments.find.mockResolvedValue(payment);
		mockClient.mandates.find.mockResolvedValue(mandate);

		const result = await handlePaymentPaidOut(event);

		expect(result.eventStatus).toBe("N/A");
		expect(mockDonorfy.createTransaction).not.toHaveBeenCalled();
	});

	it("should throw error when payment is missing", async () => {
		const event = {
			links: { payment: "PM123" },
		};

		const {
			getGoCardlessClient,
		} = require("@/app/lib/gocardless/gocardlessclient");
		getGoCardlessClient.mockReturnValue(mockClient);

		mockClient.payments.find.mockResolvedValue(null);

		await expect(handlePaymentPaidOut(event)).rejects.toThrow();
	});

	it("should throw error when mandate is missing", async () => {
		const event = {
			links: { payment: "PM123" },
		};

		const payment = {
			id: "PM123",
			amount: 5000,
			links: {},
		};

		const {
			getGoCardlessClient,
		} = require("@/app/lib/gocardless/gocardlessclient");
		getGoCardlessClient.mockReturnValue(mockClient);

		mockClient.payments.find.mockResolvedValue(payment);

		await expect(handlePaymentPaidOut(event)).rejects.toThrow();
	});

	it("should throw error when transaction creation fails", async () => {
		const event = {
			links: { payment: "PM123" },
		};

		const payment = {
			id: "PM123",
			amount: 5000,
			charge_date: "2026-01-22",
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
			metadata: {
				donorfyConstituentId: "CON123",
				additionalDetails: JSON.stringify({}),
			},
		};

		const {
			getGoCardlessClient,
		} = require("@/app/lib/gocardless/gocardlessclient");
		getGoCardlessClient.mockReturnValue(mockClient);

		mockClient.payments.find.mockResolvedValue(payment);
		mockClient.mandates.find.mockResolvedValue(mandate);
		mockClient.customers.find.mockResolvedValue(customer);
		mockDonorfy.createTransaction.mockResolvedValue({});

		await expect(handlePaymentPaidOut(event)).rejects.toThrow(
			"Failed to create transaction in Donorfy",
		);
	});

	it("should handle parse error in additionalDetails", async () => {
		const event = {
			links: { payment: "PM123" },
		};

		const payment = {
			id: "PM123",
			amount: 5000,
			charge_date: "2026-01-22",
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
			metadata: {
				donorfyConstituentId: "CON123",
				additionalDetails: "invalid json",
			},
		};

		const {
			getGoCardlessClient,
		} = require("@/app/lib/gocardless/gocardlessclient");
		getGoCardlessClient.mockReturnValue(mockClient);

		mockClient.payments.find.mockResolvedValue(payment);
		mockClient.mandates.find.mockResolvedValue(mandate);
		mockClient.customers.find.mockResolvedValue(customer);
		mockDonorfy.createTransaction.mockResolvedValue({ Id: "TRX123" });

		await handlePaymentPaidOut(event);

		expect(consoleErrorSpy).toHaveBeenCalledWith(
			"Failed to parse additionalDetails:",
			expect.any(Error),
		);
	});
});
