// Mock dependencies
jest.mock(
	"@/app/lib/webhookHandlers/stripe/helpers/processCheckoutSessionDonation"
);

describe("handleCheckoutSessionAsyncPaymentSucceeded", () => {
	let mockProcessCheckoutSessionDonation;
	let handleCheckoutSessionAsyncPaymentSucceeded;

	beforeEach(() => {
		jest.resetModules();

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
			handleCheckoutSessionAsyncPaymentSucceeded: importedFunction,
		} = require("@/app/lib/webhookHandlers/stripe/handlers/checkoutSessionAsyncPaymentSucceeded");
		handleCheckoutSessionAsyncPaymentSucceeded = importedFunction;
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	function createMockEvent(sessionOverrides = {}) {
		return {
			id: "evt_123456789",
			type: "checkout.session.async_payment_succeeded",
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

	it("should process async payment successfully", async () => {
		const event = createMockEvent();
		const stripeClient = {};

		const result = await handleCheckoutSessionAsyncPaymentSucceeded(
			event,
			stripeClient
		);

		expect(mockProcessCheckoutSessionDonation).toHaveBeenCalledWith(
			event.data.object,
			stripeClient,
			event.id,
			"Checkout Session Async Payment Succeeded"
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

	it("should pass through errors from processCheckoutSessionDonation", async () => {
		const event = createMockEvent();
		const stripeClient = {};

		const error = new Error("Processing failed");
		error.results = [{ step: "Some step", success: false }];
		mockProcessCheckoutSessionDonation.mockRejectedValue(error);

		await expect(
			handleCheckoutSessionAsyncPaymentSucceeded(event, stripeClient)
		).rejects.toThrow("Processing failed");
	});

	it("should handle USD currency", async () => {
		const event = createMockEvent({ currency: "usd", amount_total: 10000 });
		const stripeClient = {};

		await handleCheckoutSessionAsyncPaymentSucceeded(event, stripeClient);

		expect(mockProcessCheckoutSessionDonation).toHaveBeenCalledWith(
			expect.objectContaining({
				currency: "usd",
				amount_total: 10000,
			}),
			stripeClient,
			event.id,
			"Checkout Session Async Payment Succeeded"
		);
	});
});
