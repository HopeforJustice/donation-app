// Mock dependencies
jest.mock("@/app/lib/utils");

describe("handleInvoicePaymentFailed", () => {
	let consoleLogSpy, consoleErrorSpy;
	let mockStripeClient, mockDonorfy;
	let handleInvoicePaymentFailed;

	beforeEach(() => {
		jest.resetModules();
		consoleLogSpy = jest.spyOn(console, "log").mockImplementation();
		consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

		mockStripeClient = {
			customers: { retrieve: jest.fn() },
		};

		mockDonorfy = {
			duplicateCheck: jest.fn(),
			addActivity: jest.fn(),
		};

		const { getDonorfyClient } = require("@/app/lib/utils");
		getDonorfyClient.mockReturnValue(mockDonorfy);

		const {
			handleInvoicePaymentFailed: importedFunction,
		} = require("@/app/lib/webhookHandlers/stripe/handlers/invoicePaymentFailed");
		handleInvoicePaymentFailed = importedFunction;
	});

	afterEach(() => {
		jest.clearAllMocks();
		consoleLogSpy.mockRestore();
		consoleErrorSpy.mockRestore();
	});

	function createMockEvent(invoiceOverrides = {}) {
		return {
			id: "evt_123",
			type: "invoice.payment_failed",
			data: {
				object: {
					id: "in_123",
					customer: "cus_123",
					subscription: "sub_123",
					amount_due: 5000,
					currency: "gbp",
					last_finalization_error: { message: "Card declined" },
					...invoiceOverrides,
				},
			},
		};
	}

	it("should process failed payment successfully", async () => {
		const event = createMockEvent();
		const customer = { id: "cus_123", email: "test@example.com", metadata: { source: "donation-app" } };

		mockStripeClient.customers.retrieve.mockResolvedValue(customer);
		mockDonorfy.duplicateCheck.mockResolvedValue([{ ConstituentId: "CON123", Score: 20 }]);
		mockDonorfy.addActivity.mockResolvedValue({ Id: "ACT123" });

		const result = await handleInvoicePaymentFailed(event, mockStripeClient);

		expect(result.eventStatus).toBe("processed");
		expect(result.constituentId).toBe("CON123");
		expect(mockDonorfy.addActivity).toHaveBeenCalledWith(
			expect.objectContaining({
				ExistingConstituentId: "CON123",
				ActivityType: "Stripe Subscription Payment Failed",
			})
		);
	});

	it("should skip non donation-app source", async () => {
		const event = createMockEvent();
		const customer = { id: "cus_123", metadata: { source: "other-app" } };

		mockStripeClient.customers.retrieve.mockResolvedValue(customer);

		const result = await handleInvoicePaymentFailed(event, mockStripeClient);

		expect(result.eventStatus).toBe("ignored");
		expect(mockDonorfy.addActivity).not.toHaveBeenCalled();
	});

	it("should skip non-subscription invoice", async () => {
		const event = createMockEvent({ subscription: null });
		const customer = { id: "cus_123", metadata: { source: "donation-app" } };

		mockStripeClient.customers.retrieve.mockResolvedValue(customer);

		const result = await handleInvoicePaymentFailed(event, mockStripeClient);

		expect(result.eventStatus).toBe("ignored");
	});

	it("should use US Donorfy for USD currency", async () => {
		const event = createMockEvent({ currency: "usd" });
		const customer = { id: "cus_123", email: "test@example.com", metadata: { source: "donation-app" } };

		mockStripeClient.customers.retrieve.mockResolvedValue(customer);
		mockDonorfy.duplicateCheck.mockResolvedValue([{ ConstituentId: "CON123", Score: 20 }]);
		mockDonorfy.addActivity.mockResolvedValue({ Id: "ACT123" });

		const { getDonorfyClient } = require("@/app/lib/utils");
		await handleInvoicePaymentFailed(event, mockStripeClient);

		expect(getDonorfyClient).toHaveBeenCalledWith("us");
	});

	it("should throw error if constituent not found", async () => {
		const event = createMockEvent();
		const customer = { id: "cus_123", email: "test@example.com", metadata: { source: "donation-app" } };

		mockStripeClient.customers.retrieve.mockResolvedValue(customer);
		mockDonorfy.duplicateCheck.mockResolvedValue([{ ConstituentId: "CON123", Score: 10 }]);

		await expect(handleInvoicePaymentFailed(event, mockStripeClient)).rejects.toThrow();
	});
});
