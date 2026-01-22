// Mock dependencies
jest.mock("@/app/lib/gocardless/gocardlessclient");
jest.mock("@/app/lib/utils");
jest.mock("@/app/lib/mailchimp/deleteTag");
jest.mock("@/app/lib/mailchimp/getSubscriber");

describe("handleSubscriptionCancelled", () => {
	let consoleLogSpy, consoleErrorSpy;
	let mockClient, mockDonorfy;
	let handleSubscriptionCancelled;

	beforeEach(() => {
		jest.resetModules();
		consoleLogSpy = jest.spyOn(console, "log").mockImplementation();
		consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

		mockClient = {
			subscriptions: {
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
			getConstituent: jest.fn(),
			removeTag: jest.fn(),
			addActivity: jest.fn(),
		};

		const {
			getGoCardlessClient,
		} = require("@/app/lib/gocardless/gocardlessclient");
		getGoCardlessClient.mockReturnValue(mockClient);

		const { getDonorfyClient } = require("@/app/lib/utils");
		getDonorfyClient.mockReturnValue(mockDonorfy);

		const deleteTag = require("@/app/lib/mailchimp/deleteTag");
		deleteTag.default = jest.fn().mockResolvedValue(true);

		const getSubscriber = require("@/app/lib/mailchimp/getSubscriber");
		getSubscriber.default = jest.fn().mockResolvedValue({ id: "sub123" });

		const {
			handleSubscriptionCancelled: importedFunction,
		} = require("@/app/lib/webhookHandlers/goCardless/handleSubscriptionCancelled");
		handleSubscriptionCancelled = importedFunction;
	});

	afterEach(() => {
		jest.clearAllMocks();
		consoleLogSpy.mockRestore();
		consoleErrorSpy.mockRestore();
	});

	it("should process subscription cancellation successfully", async () => {
		const event = {
			links: { subscription: "SB123" },
		};

		const subscription = {
			id: "SB123",
			links: { mandate: "MD123" },
		};

		const mandate = {
			links: { customer: "CU123" },
		};

		const customer = {
			id: "CU123",
			email: "test@example.com",
			metadata: {
				donorfyConstituentId: "CON123",
				additionalDetails: JSON.stringify({ amount: 50 }),
			},
		};

		const constituent = {
			EmailAddress: "test@example.com",
		};

		mockClient.subscriptions.find.mockResolvedValue(subscription);
		mockClient.mandates.find.mockResolvedValue(mandate);
		mockClient.customers.find.mockResolvedValue(customer);
		mockDonorfy.getConstituent.mockResolvedValue(constituent);
		mockDonorfy.removeTag.mockResolvedValue(true);
		mockDonorfy.addActivity.mockResolvedValue(true);

		const deleteTag = require("@/app/lib/mailchimp/deleteTag");
		const getSubscriber = require("@/app/lib/mailchimp/getSubscriber");

		const result = await handleSubscriptionCancelled(event);

		expect(result.status).toBe(200);
		expect(result.eventStatus).toBe("processed");
		expect(getSubscriber.default).toHaveBeenCalledWith("test@example.com");
		expect(deleteTag.default).toHaveBeenCalledWith(
			"test@example.com",
			"Gocardless Active Subscription",
			"uk",
		);
		expect(mockDonorfy.removeTag).toHaveBeenCalledWith(
			"CON123",
			"Gocardless_Active Subscription",
		);
		expect(mockDonorfy.addActivity).toHaveBeenCalledWith({
			ActivityType: "Gocardless Subscription Cancelled",
			Notes: "Amount: 50",
			Number1: 50,
			ExistingConstituentId: "CON123",
		});
	});

	it("should handle subscriber not found in Mailchimp", async () => {
		const event = {
			links: { subscription: "SB123" },
		};

		const subscription = {
			id: "SB123",
			links: { mandate: "MD123" },
		};

		const mandate = {
			links: { customer: "CU123" },
		};

		const customer = {
			id: "CU123",
			email: "test@example.com",
			metadata: {
				donorfyConstituentId: "CON123",
				additionalDetails: JSON.stringify({ amount: 50 }),
			},
		};

		const constituent = {
			EmailAddress: "test@example.com",
		};

		mockClient.subscriptions.find.mockResolvedValue(subscription);
		mockClient.mandates.find.mockResolvedValue(mandate);
		mockClient.customers.find.mockResolvedValue(customer);
		mockDonorfy.getConstituent.mockResolvedValue(constituent);
		mockDonorfy.removeTag.mockResolvedValue(true);
		mockDonorfy.addActivity.mockResolvedValue(true);

		const getSubscriber = require("@/app/lib/mailchimp/getSubscriber");
		getSubscriber.default.mockRejectedValue(new Error("Subscriber not found"));

		const deleteTag = require("@/app/lib/mailchimp/deleteTag");

		const result = await handleSubscriptionCancelled(event);

		expect(result.status).toBe(200);
		expect(consoleErrorSpy).toHaveBeenCalled();
		expect(deleteTag.default).not.toHaveBeenCalled();
		expect(mockDonorfy.removeTag).toHaveBeenCalled();
	});

	it("should throw error when customer not found", async () => {
		const event = {
			links: { subscription: "SB123" },
		};

		const subscription = {
			id: "SB123",
			links: { mandate: "MD123" },
		};

		const mandate = {
			links: { customer: "CU123" },
		};

		mockClient.subscriptions.find.mockResolvedValue(subscription);
		mockClient.mandates.find.mockResolvedValue(mandate);
		mockClient.customers.find.mockResolvedValue(null);

		await expect(handleSubscriptionCancelled(event)).rejects.toThrow();
	});

	it("should include error details in thrown error", async () => {
		const event = {
			links: { subscription: "SB123" },
		};

		mockClient.subscriptions.find.mockRejectedValue(
			new Error("GoCardless API error"),
		);

		try {
			await handleSubscriptionCancelled(event);
		} catch (error) {
			expect(error.results).toBeDefined();
			expect(error.goCardlessCustomerId).toBeDefined();
			expect(error.constituentId).toBeDefined();
		}
	});
});
