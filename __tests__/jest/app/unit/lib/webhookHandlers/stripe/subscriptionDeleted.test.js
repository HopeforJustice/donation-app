// Mock dependencies
jest.mock("@/app/lib/utils");

describe("handleSubscriptionDeleted", () => {
	let consoleLogSpy, consoleErrorSpy;
	let mockStripeClient, mockDonorfy;
	let handleSubscriptionDeleted;

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
			handleSubscriptionDeleted: importedFunction,
		} = require("@/app/lib/webhookHandlers/stripe/handlers/subscriptionDeleted");
		handleSubscriptionDeleted = importedFunction;
	});

	afterEach(() => {
		jest.clearAllMocks();
		consoleLogSpy.mockRestore();
		consoleErrorSpy.mockRestore();
	});

	function createMockEvent(subscriptionOverrides = {}) {
		return {
			id: "evt_123",
			type: "customer.subscription.deleted",
			data: {
				object: {
					id: "sub_123",
					customer: "cus_123",
					currency: "gbp",
					amount: 5000,
					metadata: { source: "donation-app" },
					...subscriptionOverrides,
				},
			},
		};
	}

	it("should process subscription deletion successfully", async () => {
		const event = createMockEvent();
		const customer = { id: "cus_123", email: "test@example.com" };

		mockStripeClient.customers.retrieve.mockResolvedValue(customer);
		mockDonorfy.duplicateCheck.mockResolvedValue([{ ConstituentId: "CON123", Score: 20 }]);
		mockDonorfy.addActivity.mockResolvedValue({ Id: "ACT123" });

		const result = await handleSubscriptionDeleted(event, mockStripeClient);

		expect(result.eventStatus).toBe("processed");
		expect(result.constituentId).toBe("CON123");
		expect(mockDonorfy.addActivity).toHaveBeenCalledWith(
			expect.objectContaining({
				ExistingConstituentId: "CON123",
				ActivityType: "Stripe Subscription Cancelled",
			})
		);
	});

	it("should skip non donation-app source", async () => {
		const event = createMockEvent({ metadata: { source: "other-app" } });
		const customer = { id: "cus_123" };

		mockStripeClient.customers.retrieve.mockResolvedValue(customer);

		const result = await handleSubscriptionDeleted(event, mockStripeClient);

		expect(result.eventStatus).toBe("ignored");
		expect(mockDonorfy.addActivity).not.toHaveBeenCalled();
	});

	it("should use US Donorfy for USD currency", async () => {
		const event = createMockEvent({ currency: "usd" });
		const customer = { id: "cus_123", email: "test@example.com" };

		mockStripeClient.customers.retrieve.mockResolvedValue(customer);
		mockDonorfy.duplicateCheck.mockResolvedValue([{ ConstituentId: "CON123", Score: 20 }]);
		mockDonorfy.addActivity.mockResolvedValue({ Id: "ACT123" });

		const { getDonorfyClient } = require("@/app/lib/utils");
		await handleSubscriptionDeleted(event, mockStripeClient);

		expect(getDonorfyClient).toHaveBeenCalledWith("us");
	});

	it("should use UK Donorfy for GBP currency", async () => {
		const event = createMockEvent({ currency: "gbp" });
		const customer = { id: "cus_123", email: "test@example.com" };

		mockStripeClient.customers.retrieve.mockResolvedValue(customer);
		mockDonorfy.duplicateCheck.mockResolvedValue([{ ConstituentId: "CON123", Score: 20 }]);
		mockDonorfy.addActivity.mockResolvedValue({ Id: "ACT123" });

		const { getDonorfyClient } = require("@/app/lib/utils");
		await handleSubscriptionDeleted(event, mockStripeClient);

		expect(getDonorfyClient).toHaveBeenCalledWith("uk");
	});

	it("should throw error if constituent not found", async () => {
		const event = createMockEvent();
		const customer = { id: "cus_123", email: "test@example.com" };

		mockStripeClient.customers.retrieve.mockResolvedValue(customer);
		mockDonorfy.duplicateCheck.mockResolvedValue([{ ConstituentId: "CON123", Score: 10 }]);

		await expect(handleSubscriptionDeleted(event, mockStripeClient)).rejects.toThrow();
	});

	it("should include subscription amount in activity notes", async () => {
		const event = createMockEvent({ amount: 2500 });
		const customer = { id: "cus_123", email: "test@example.com" };

		mockStripeClient.customers.retrieve.mockResolvedValue(customer);
		mockDonorfy.duplicateCheck.mockResolvedValue([{ ConstituentId: "CON123", Score: 20 }]);
		mockDonorfy.addActivity.mockResolvedValue({ Id: "ACT123" });

		await handleSubscriptionDeleted(event, mockStripeClient);

		expect(mockDonorfy.addActivity).toHaveBeenCalledWith(
			expect.objectContaining({
				Number1: 25,
			})
		);
	});
});
