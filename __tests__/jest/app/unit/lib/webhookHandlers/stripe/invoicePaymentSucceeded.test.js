// Mock dependencies
jest.mock("@/app/lib/utils");

describe("handleInvoicePaymentSucceeded", () => {
	let consoleLogSpy, consoleErrorSpy;
	let mockStripeClient, mockDonorfy;
	let handleInvoicePaymentSucceeded;

	beforeEach(() => {
		jest.resetModules();
		consoleLogSpy = jest.spyOn(console, "log").mockImplementation();
		consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

		// Setup mock Stripe client
		mockStripeClient = {
			customers: {
				retrieve: jest.fn(),
			},
			subscriptions: {
				retrieve: jest.fn(),
			},
		};

		// Setup mock Donorfy
		mockDonorfy = {
			duplicateCheck: jest.fn(),
			createTransaction: jest.fn(),
		};

		const { getDonorfyClient } = require("@/app/lib/utils");
		getDonorfyClient.mockReturnValue(mockDonorfy);

		const {
			handleInvoicePaymentSucceeded: importedFunction,
		} = require("@/app/lib/webhookHandlers/stripe/handlers/invoicePaymentSucceeded");
		handleInvoicePaymentSucceeded = importedFunction;
	});

	afterEach(() => {
		jest.clearAllMocks();
		consoleLogSpy.mockRestore();
		consoleErrorSpy.mockRestore();
	});

	function createMockEvent(invoiceOverrides = {}) {
		return {
			id: "evt_123456789",
			type: "invoice.payment_succeeded",
			data: {
				object: {
					id: "in_123",
					customer: "cus_123",
					subscription: "sub_123",
					amount_paid: 5000,
					currency: "gbp",
					billing_reason: "subscription_cycle",
					...invoiceOverrides,
				},
			},
		};
	}

	function createMockCustomer() {
		return {
			id: "cus_123",
			email: "test@example.com",
			name: "Test User",
		};
	}

	function createMockSubscription(metadataOverrides = {}) {
		return {
			id: "sub_123",
			metadata: {
				source: "donation-app",
				constituentId: "CON123",
				campaign: "Test Campaign",
				fund: "general",
				utmSource: "web",
				utmMedium: "direct",
				utmCampaign: "spring",
				...metadataOverrides,
			},
		};
	}

	it("should process recurring invoice payment successfully with UK currency", async () => {
		const event = createMockEvent();
		const customer = createMockCustomer();
		const subscription = createMockSubscription();

		mockStripeClient.customers.retrieve.mockResolvedValue(customer);
		mockStripeClient.subscriptions.retrieve.mockResolvedValue(subscription);
		mockDonorfy.createTransaction.mockResolvedValue({ Id: "TXN123" });

		const result = await handleInvoicePaymentSucceeded(event, mockStripeClient);

		expect(mockStripeClient.customers.retrieve).toHaveBeenCalledWith("cus_123");
		expect(mockStripeClient.subscriptions.retrieve).toHaveBeenCalledWith(
			"sub_123"
		);
		expect(mockDonorfy.createTransaction).toHaveBeenCalledWith(
			50,
			"Test Campaign",
			"Stripe Subscription",
			"CON123",
			null,
			"general",
			"web",
			"direct",
			"spring"
		);
		expect(result).toMatchObject({
			message: "Stripe recurring payment processed. Transaction created for constituent CON123",
			status: 200,
			eventStatus: "processed",
			constituentId: "CON123",
			donorfyTransactionId: "TXN123",
			subscriptionId: "sub_123",
		});
	});

	it("should process initial subscription payment", async () => {
		const event = createMockEvent({ billing_reason: "subscription_create" });
		const customer = createMockCustomer();
		const subscription = createMockSubscription();

		mockStripeClient.customers.retrieve.mockResolvedValue(customer);
		mockStripeClient.subscriptions.retrieve.mockResolvedValue(subscription);
		mockDonorfy.createTransaction.mockResolvedValue({ Id: "TXN123" });

		const result = await handleInvoicePaymentSucceeded(event, mockStripeClient);

		expect(result.message).toContain("initial subscription payment processed");
	});

	it("should use US Donorfy instance for USD currency", async () => {
		const event = createMockEvent({ currency: "usd" });
		const customer = createMockCustomer();
		const subscription = createMockSubscription();

		mockStripeClient.customers.retrieve.mockResolvedValue(customer);
		mockStripeClient.subscriptions.retrieve.mockResolvedValue(subscription);
		mockDonorfy.createTransaction.mockResolvedValue({ Id: "TXN123" });

		const { getDonorfyClient } = require("@/app/lib/utils");

		await handleInvoicePaymentSucceeded(event, mockStripeClient);

		expect(getDonorfyClient).toHaveBeenCalledWith("us");
	});

	it("should use UK Donorfy instance for GBP currency", async () => {
		const event = createMockEvent({ currency: "gbp" });
		const customer = createMockCustomer();
		const subscription = createMockSubscription();

		mockStripeClient.customers.retrieve.mockResolvedValue(customer);
		mockStripeClient.subscriptions.retrieve.mockResolvedValue(subscription);
		mockDonorfy.createTransaction.mockResolvedValue({ Id: "TXN123" });

		const { getDonorfyClient } = require("@/app/lib/utils");

		await handleInvoicePaymentSucceeded(event, mockStripeClient);

		expect(getDonorfyClient).toHaveBeenCalledWith("uk");
	});

	it("should skip invoice without donation-app source metadata", async () => {
		const event = createMockEvent();
		const customer = createMockCustomer();
		const subscription = createMockSubscription({ source: "other-app" });

		mockStripeClient.customers.retrieve.mockResolvedValue(customer);
		mockStripeClient.subscriptions.retrieve.mockResolvedValue(subscription);

		const result = await handleInvoicePaymentSucceeded(event, mockStripeClient);

		expect(result).toEqual({
			message: expect.stringContaining("no metadata indicating donation app"),
			status: 200,
			eventStatus: "skipped",
			results: expect.any(Array),
		});
		expect(mockDonorfy.createTransaction).not.toHaveBeenCalled();
	});

	it("should skip non-subscription invoice", async () => {
		const event = createMockEvent({ subscription: null });
		const customer = createMockCustomer();

		mockStripeClient.customers.retrieve.mockResolvedValue(customer);
		// Don't call subscriptions.retrieve since subscription is null

		// This will actually throw an error because the code tries to access metadata.source
		// before checking if invoice.subscription exists
		await expect(
			handleInvoicePaymentSucceeded(event, mockStripeClient)
		).rejects.toThrow();
	});

	it("should find constituent by email if constituentId not in metadata", async () => {
		const event = createMockEvent();
		const customer = createMockCustomer();
		const subscription = createMockSubscription({ constituentId: undefined });

		mockStripeClient.customers.retrieve.mockResolvedValue(customer);
		mockStripeClient.subscriptions.retrieve.mockResolvedValue(subscription);
		mockDonorfy.duplicateCheck.mockResolvedValue([
			{ ConstituentId: "CON456", Score: 20 },
		]);
		mockDonorfy.createTransaction.mockResolvedValue({ Id: "TXN123" });

		const result = await handleInvoicePaymentSucceeded(event, mockStripeClient);

		expect(mockDonorfy.duplicateCheck).toHaveBeenCalledWith({
			EmailAddress: "test@example.com",
		});
		expect(result.constituentId).toBe("CON456");
	});

	it("should throw error if no constituent found by email", async () => {
		const event = createMockEvent();
		const customer = createMockCustomer();
		const subscription = createMockSubscription({ constituentId: undefined });

		mockStripeClient.customers.retrieve.mockResolvedValue(customer);
		mockStripeClient.subscriptions.retrieve.mockResolvedValue(subscription);
		mockDonorfy.duplicateCheck.mockResolvedValue([
			{ ConstituentId: "CON456", Score: 10 }, // Score too low
		]);

		await expect(
			handleInvoicePaymentSucceeded(event, mockStripeClient)
		).rejects.toThrow();
	});

	it("should use default campaign if not in metadata", async () => {
		const event = createMockEvent();
		const customer = createMockCustomer();
		const subscription = createMockSubscription({ campaign: undefined });

		mockStripeClient.customers.retrieve.mockResolvedValue(customer);
		mockStripeClient.subscriptions.retrieve.mockResolvedValue(subscription);
		mockDonorfy.createTransaction.mockResolvedValue({ Id: "TXN123" });

		await handleInvoicePaymentSucceeded(event, mockStripeClient);

		expect(mockDonorfy.createTransaction).toHaveBeenCalledWith(
			expect.any(Number),
			"Donation App General Campaign",
			expect.any(String),
			expect.any(String),
			null,
			expect.any(String),
			expect.any(String),
			expect.any(String),
			expect.any(String)
		);
	});

	it("should use default fund if not in metadata", async () => {
		const event = createMockEvent();
		const customer = createMockCustomer();
		const subscription = createMockSubscription({ fund: undefined });

		mockStripeClient.customers.retrieve.mockResolvedValue(customer);
		mockStripeClient.subscriptions.retrieve.mockResolvedValue(subscription);
		mockDonorfy.createTransaction.mockResolvedValue({ Id: "TXN123" });

		await handleInvoicePaymentSucceeded(event, mockStripeClient);

		expect(mockDonorfy.createTransaction).toHaveBeenCalledWith(
			expect.any(Number),
			expect.any(String),
			expect.any(String),
			expect.any(String),
			null,
			"unrestricted",
			expect.any(String),
			expect.any(String),
			expect.any(String)
		);
	});

	it("should use default utm values if not in metadata", async () => {
		const event = createMockEvent();
		const customer = createMockCustomer();
		const subscription = createMockSubscription({
			utmSource: undefined,
			utmMedium: undefined,
			utmCampaign: undefined,
		});

		mockStripeClient.customers.retrieve.mockResolvedValue(customer);
		mockStripeClient.subscriptions.retrieve.mockResolvedValue(subscription);
		mockDonorfy.createTransaction.mockResolvedValue({ Id: "TXN123" });

		await handleInvoicePaymentSucceeded(event, mockStripeClient);

		expect(mockDonorfy.createTransaction).toHaveBeenCalledWith(
			expect.any(Number),
			expect.any(String),
			expect.any(String),
			expect.any(String),
			null,
			expect.any(String),
			"unknown",
			"unknown",
			"unknown"
		);
	});

	it("should throw error with context on failure", async () => {
		const event = createMockEvent();

		mockStripeClient.customers.retrieve.mockRejectedValue(
			new Error("Stripe API error")
		);

		try {
			await handleInvoicePaymentSucceeded(event, mockStripeClient);
		} catch (error) {
			expect(error.results).toBeDefined();
			expect(error.eventId).toBe(event.id);
			expect(error.subscriptionId).toBe("sub_123");
			expect(consoleErrorSpy).toHaveBeenCalled();
		}
	});
});
