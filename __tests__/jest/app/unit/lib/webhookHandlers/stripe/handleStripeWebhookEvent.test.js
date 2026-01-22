// Mock dependencies
jest.mock("@vercel/postgres");
jest.mock("@/app/lib/db/storeWebhookEvent");
jest.mock(
	"@/app/lib/webhookHandlers/stripe/handlers/checkoutSessionCompleted"
);
jest.mock(
	"@/app/lib/webhookHandlers/stripe/handlers/checkoutSessionAsyncPaymentSucceeded"
);
jest.mock("@/app/lib/webhookHandlers/stripe/handlers/subscriptionCreated");
jest.mock("@/app/lib/webhookHandlers/stripe/handlers/subscriptionDeleted");
jest.mock("@/app/lib/webhookHandlers/stripe/handlers/subscriptionUpdated");
jest.mock(
	"@/app/lib/webhookHandlers/stripe/handlers/invoicePaymentSucceeded"
);
jest.mock("@/app/lib/webhookHandlers/stripe/handlers/invoicePaymentFailed");

describe("handleStripeWebhookEvent", () => {
	let consoleLogSpy, mockSql, mockStoreWebhookEvent;
	let handleStripeWebhookEvent;
	let mockHandlers;

	beforeEach(() => {
		jest.resetModules();
		consoleLogSpy = jest.spyOn(console, "log").mockImplementation();

		// Setup mock SQL
		const { sql } = require("@vercel/postgres");
		mockSql = jest.fn();
		sql.mockImplementation(mockSql);

		// Setup mock store webhook event
		mockStoreWebhookEvent = require("@/app/lib/db/storeWebhookEvent");
		mockStoreWebhookEvent.default = jest.fn().mockResolvedValue(true);

		// Setup mock handlers
		const checkoutSessionCompleted = require("@/app/lib/webhookHandlers/stripe/handlers/checkoutSessionCompleted");
		const checkoutSessionAsyncPaymentSucceeded = require("@/app/lib/webhookHandlers/stripe/handlers/checkoutSessionAsyncPaymentSucceeded");
		const subscriptionCreated = require("@/app/lib/webhookHandlers/stripe/handlers/subscriptionCreated");
		const subscriptionDeleted = require("@/app/lib/webhookHandlers/stripe/handlers/subscriptionDeleted");
		const invoicePaymentSucceeded = require("@/app/lib/webhookHandlers/stripe/handlers/invoicePaymentSucceeded");
		const invoicePaymentFailed = require("@/app/lib/webhookHandlers/stripe/handlers/invoicePaymentFailed");

		mockHandlers = {
			checkoutSessionCompleted: jest.fn().mockResolvedValue({
				message: "Checkout session completed",
				status: 200,
			}),
			checkoutSessionAsyncPaymentSucceeded: jest.fn().mockResolvedValue({
				message: "Async payment succeeded",
				status: 200,
			}),
			subscriptionCreated: jest.fn().mockResolvedValue({
				message: "Subscription created",
				status: 200,
			}),
			subscriptionDeleted: jest.fn().mockResolvedValue({
				message: "Subscription deleted",
				status: 200,
			}),
			invoicePaymentSucceeded: jest.fn().mockResolvedValue({
				message: "Invoice payment succeeded",
				status: 200,
			}),
			invoicePaymentFailed: jest.fn().mockResolvedValue({
				message: "Invoice payment failed",
				status: 200,
			}),
		};

		checkoutSessionCompleted.handleCheckoutSessionCompleted =
			mockHandlers.checkoutSessionCompleted;
		checkoutSessionAsyncPaymentSucceeded.handleCheckoutSessionAsyncPaymentSucceeded =
			mockHandlers.checkoutSessionAsyncPaymentSucceeded;
		subscriptionCreated.handleSubscriptionCreated =
			mockHandlers.subscriptionCreated;
		subscriptionDeleted.handleSubscriptionDeleted =
			mockHandlers.subscriptionDeleted;
		invoicePaymentSucceeded.handleInvoicePaymentSucceeded =
			mockHandlers.invoicePaymentSucceeded;
		invoicePaymentFailed.handleInvoicePaymentFailed =
			mockHandlers.invoicePaymentFailed;

		const {
			handleStripeWebhookEvent: importedFunction,
		} = require("@/app/lib/webhookHandlers/stripe/handleStripeWebhookEvent");
		handleStripeWebhookEvent = importedFunction;
	});

	afterEach(() => {
		jest.clearAllMocks();
		consoleLogSpy.mockRestore();
	});

	function createMockEvent(type = "checkout.session.completed") {
		return {
			id: "evt_123456789",
			type,
			data: {
				object: {
					id: "obj_123",
				},
			},
		};
	}

	it("should detect and ignore duplicate events", async () => {
		const event = createMockEvent();

		// Mock SQL to return an existing event with status "completed"
		mockSql.mockResolvedValue({
			rows: [{ status: "completed" }],
		});

		const result = await handleStripeWebhookEvent(event, {});

		expect(result).toEqual({
			message: `Duplicate webhook ignored: ${event.id}`,
			status: 200,
			eventStatus: "ignored",
		});
		expect(consoleLogSpy).toHaveBeenCalledWith(
			`Duplicate webhook ignored: ${event.id} (status: completed)`
		);
		expect(mockStoreWebhookEvent.default).not.toHaveBeenCalled();
	});

	it("should process non-duplicate checkout.session.completed events", async () => {
		const event = createMockEvent("checkout.session.completed");
		const stripeClient = {};

		// Mock SQL to return no existing event
		mockSql.mockResolvedValue({ rows: [] });

		const result = await handleStripeWebhookEvent(event, stripeClient);

		expect(mockStoreWebhookEvent.default).toHaveBeenCalledWith(
			event,
			"processing",
			"Started processing webhook event",
			null,
			null,
			null,
			null
		);
		expect(mockHandlers.checkoutSessionCompleted).toHaveBeenCalledWith(
			event,
			stripeClient
		);
		expect(result).toEqual({
			message: "Checkout session completed",
			status: 200,
		});
	});

	it("should route checkout.session.async_payment_succeeded to correct handler", async () => {
		const event = createMockEvent("checkout.session.async_payment_succeeded");
		const stripeClient = {};

		mockSql.mockResolvedValue({ rows: [] });

		await handleStripeWebhookEvent(event, stripeClient);

		expect(mockHandlers.checkoutSessionAsyncPaymentSucceeded).toHaveBeenCalledWith(
			event,
			stripeClient
		);
	});

	it("should route customer.subscription.created to correct handler", async () => {
		const event = createMockEvent("customer.subscription.created");
		const stripeClient = {};

		mockSql.mockResolvedValue({ rows: [] });

		await handleStripeWebhookEvent(event, stripeClient);

		expect(mockHandlers.subscriptionCreated).toHaveBeenCalledWith(
			event,
			stripeClient
		);
	});

	it("should route customer.subscription.deleted to correct handler", async () => {
		const event = createMockEvent("customer.subscription.deleted");
		const stripeClient = {};

		mockSql.mockResolvedValue({ rows: [] });

		await handleStripeWebhookEvent(event, stripeClient);

		expect(mockHandlers.subscriptionDeleted).toHaveBeenCalledWith(
			event,
			stripeClient
		);
	});

	it("should route invoice.payment_succeeded to correct handler", async () => {
		const event = createMockEvent("invoice.payment_succeeded");
		const stripeClient = {};

		mockSql.mockResolvedValue({ rows: [] });

		await handleStripeWebhookEvent(event, stripeClient);

		expect(mockHandlers.invoicePaymentSucceeded).toHaveBeenCalledWith(
			event,
			stripeClient
		);
	});

	it("should route invoice.payment_failed to correct handler", async () => {
		const event = createMockEvent("invoice.payment_failed");
		const stripeClient = {};

		mockSql.mockResolvedValue({ rows: [] });

		await handleStripeWebhookEvent(event, stripeClient);

		expect(mockHandlers.invoicePaymentFailed).toHaveBeenCalledWith(
			event,
			stripeClient
		);
	});

	it("should return ignored status for unhandled event types", async () => {
		const event = createMockEvent("payment_intent.succeeded");

		mockSql.mockResolvedValue({ rows: [] });

		const result = await handleStripeWebhookEvent(event, {});

		expect(result).toEqual({
			message: `Unhandled event type: ${event.type}`,
			status: 200,
			eventStatus: "ignored",
		});
		expect(consoleLogSpy).toHaveBeenCalledWith(
			`Unhandled event type: ${event.type}`
		);
	});

	it("should allow event with status 'received' to be reprocessed", async () => {
		const event = createMockEvent();

		// Mock SQL to return event with status "received"
		mockSql.mockResolvedValue({
			rows: [{ status: "received" }],
		});

		await handleStripeWebhookEvent(event, {});

		expect(mockStoreWebhookEvent.default).toHaveBeenCalled();
		expect(mockHandlers.checkoutSessionCompleted).toHaveBeenCalled();
	});
});
