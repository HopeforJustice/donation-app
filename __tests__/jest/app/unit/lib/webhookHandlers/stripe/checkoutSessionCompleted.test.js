// Mock dependencies
jest.mock(
	"@/app/lib/webhookHandlers/stripe/helpers/processCheckoutSessionDonation"
);

describe("handleCheckoutSessionCompleted", () => {
	let consoleLogSpy, consoleErrorSpy;
	let mockStripeClient;
	let mockProcessCheckoutSessionDonation;
	let handleCheckoutSessionCompleted;

	beforeEach(() => {
		jest.resetModules();
		consoleLogSpy = jest.spyOn(console, "log").mockImplementation();
		consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

		// Setup mock Stripe client
		mockStripeClient = {
			paymentIntents: {
				retrieve: jest.fn(),
			},
			paymentMethods: {
				retrieve: jest.fn(),
			},
		};

		// Setup mock processCheckoutSessionDonation
		const processModule = require("@/app/lib/webhookHandlers/stripe/helpers/processCheckoutSessionDonation");
		mockProcessCheckoutSessionDonation = jest.fn().mockResolvedValue({
			message: "Donation processed",
			status: 200,
			eventStatus: "completed",
			results: [],
			constituentId: "CON123",
			transactionId: "TXN123",
		});
		processModule.processCheckoutSessionDonation =
			mockProcessCheckoutSessionDonation;

		const {
			handleCheckoutSessionCompleted: importedFunction,
		} = require("@/app/lib/webhookHandlers/stripe/handlers/checkoutSessionCompleted");
		handleCheckoutSessionCompleted = importedFunction;
	});

	afterEach(() => {
		jest.clearAllMocks();
		consoleLogSpy.mockRestore();
		consoleErrorSpy.mockRestore();
	});

	function createMockEvent(sessionOverrides = {}) {
		return {
			id: "evt_123456789",
			type: "checkout.session.completed",
			data: {
				object: {
					id: "cs_test_123",
					payment_intent: "pi_123",
					payment_status: "paid",
					amount_total: 5000,
					currency: "gbp",
					...sessionOverrides,
				},
			},
		};
	}

	it("should process non-async payment successfully", async () => {
		const event = createMockEvent();

		mockStripeClient.paymentIntents.retrieve.mockResolvedValue({
			id: "pi_123",
			payment_method: "pm_123",
		});

		mockStripeClient.paymentMethods.retrieve.mockResolvedValue({
			id: "pm_123",
			type: "card",
		});

		const result = await handleCheckoutSessionCompleted(
			event,
			mockStripeClient
		);

		expect(mockStripeClient.paymentIntents.retrieve).toHaveBeenCalledWith(
			"pi_123"
		);
		expect(mockStripeClient.paymentMethods.retrieve).toHaveBeenCalledWith(
			"pm_123"
		);
		expect(mockProcessCheckoutSessionDonation).toHaveBeenCalledWith(
			event.data.object,
			mockStripeClient,
			event.id,
			"Checkout Session Completed"
		);
		expect(result).toEqual({
			message: "Donation processed",
			status: 200,
			eventStatus: "completed",
			results: [],
			constituentId: "CON123",
			transactionId: "TXN123",
		});
	});

	it("should skip customer_balance async payment method", async () => {
		const event = createMockEvent();

		mockStripeClient.paymentIntents.retrieve.mockResolvedValue({
			id: "pi_123",
			payment_method: "pm_123",
		});

		mockStripeClient.paymentMethods.retrieve.mockResolvedValue({
			id: "pm_123",
			type: "customer_balance",
		});

		const result = await handleCheckoutSessionCompleted(
			event,
			mockStripeClient
		);

		expect(result).toEqual({
			message:
				"Async payment checkout ignored - handled by checkout.session.async_payment_succeeded",
			status: 200,
			eventStatus: "skipped",
			results: [],
		});
		expect(consoleLogSpy).toHaveBeenCalledWith(
			expect.stringContaining("Skipping async payment checkout")
		);
		expect(mockProcessCheckoutSessionDonation).not.toHaveBeenCalled();
	});

	it("should skip pay_by_bank async payment method", async () => {
		const event = createMockEvent();

		mockStripeClient.paymentIntents.retrieve.mockResolvedValue({
			id: "pi_123",
			payment_method: "pm_123",
		});

		mockStripeClient.paymentMethods.retrieve.mockResolvedValue({
			id: "pm_123",
			type: "pay_by_bank",
		});

		const result = await handleCheckoutSessionCompleted(
			event,
			mockStripeClient
		);

		expect(result.eventStatus).toBe("skipped");
		expect(mockProcessCheckoutSessionDonation).not.toHaveBeenCalled();
	});

	it("should skip unpaid payment status", async () => {
		const event = createMockEvent({ payment_status: "unpaid" });

		mockStripeClient.paymentIntents.retrieve.mockResolvedValue({
			id: "pi_123",
			payment_method: "pm_123",
		});

		mockStripeClient.paymentMethods.retrieve.mockResolvedValue({
			id: "pm_123",
			type: "card",
		});

		const result = await handleCheckoutSessionCompleted(
			event,
			mockStripeClient
		);

		expect(result.eventStatus).toBe("skipped");
		expect(mockProcessCheckoutSessionDonation).not.toHaveBeenCalled();
	});

	it("should handle payment intent without payment method", async () => {
		const event = createMockEvent();

		mockStripeClient.paymentIntents.retrieve.mockResolvedValue({
			id: "pi_123",
			payment_method: null,
		});

		const result = await handleCheckoutSessionCompleted(
			event,
			mockStripeClient
		);

		expect(mockProcessCheckoutSessionDonation).toHaveBeenCalled();
		expect(result.eventStatus).toBe("completed");
	});

	it("should handle session without payment intent", async () => {
		const event = createMockEvent({ payment_intent: null });

		const result = await handleCheckoutSessionCompleted(
			event,
			mockStripeClient
		);

		expect(mockStripeClient.paymentIntents.retrieve).not.toHaveBeenCalled();
		expect(mockProcessCheckoutSessionDonation).toHaveBeenCalled();
		expect(result.eventStatus).toBe("completed");
	});

	it("should throw error with context on failure", async () => {
		const event = createMockEvent();

		mockStripeClient.paymentIntents.retrieve.mockRejectedValue(
			new Error("Stripe API error")
		);

		await expect(
			handleCheckoutSessionCompleted(event, mockStripeClient)
		).rejects.toThrow();

		expect(consoleErrorSpy).toHaveBeenCalledWith(
			"Error processing checkout session webhook:",
			expect.any(Array)
		);
	});

	it("should preserve error results if already set", async () => {
		const event = createMockEvent();

		mockStripeClient.paymentIntents.retrieve.mockResolvedValue({
			id: "pi_123",
			payment_method: "pm_123",
		});

		mockStripeClient.paymentMethods.retrieve.mockResolvedValue({
			id: "pm_123",
			type: "card",
		});

		const errorWithResults = new Error("Processing failed");
		errorWithResults.results = [
			{ step: "Some step", success: false },
		];
		mockProcessCheckoutSessionDonation.mockRejectedValue(errorWithResults);

		try {
			await handleCheckoutSessionCompleted(event, mockStripeClient);
		} catch (error) {
			expect(error.results).toEqual([
				{ step: "Some step", success: false },
			]);
			expect(error.eventId).toBe(event.id);
		}
	});
});
