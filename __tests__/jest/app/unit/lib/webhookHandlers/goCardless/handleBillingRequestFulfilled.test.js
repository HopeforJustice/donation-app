// Mock dependencies
jest.mock("@/app/lib/gocardless/gocardlessclient");
jest.mock("@/app/lib/mailchimp/addUpdateSubscriber");
jest.mock("@/app/lib/mailchimp/addTag");
jest.mock("@/app/lib/sparkpost/sendDirectDebitConfirmationEmail", () =>
	jest.fn().mockResolvedValue({
		accepted: [{ recipient: "test@example.com" }],
		rejected: [],
	})
);
jest.mock("@/app/lib/utils");

describe("handleBillingRequestFulfilled", () => {
	let consoleLogSpy, consoleErrorSpy;
	let mockClient, mockDonorfy;
	let handleBillingRequestFulfilled;

	beforeEach(() => {
		jest.resetModules();
		consoleLogSpy = jest.spyOn(console, "log").mockImplementation();
		consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

		// Setup mock client
		mockClient = {
			billingRequests: {
				find: jest.fn(),
			},
			customers: {
				find: jest.fn(),
				update: jest.fn(),
			},
			subscriptions: {
				create: jest.fn(),
			},
		};

		// Setup mock Donorfy
		mockDonorfy = {
			duplicateCheck: jest.fn(),
			createConstituent: jest.fn(),
			updateConstituent: jest.fn(),
			updateConstituentPreferences: jest.fn(),
			createGiftAidDeclaration: jest.fn(),
			addActiveTags: jest.fn(),
			addActivity: jest.fn(),
		};

		const {
			getGoCardlessClient,
		} = require("@/app/lib/gocardless/gocardlessclient");
		getGoCardlessClient.mockReturnValue(mockClient);

		const {
			getDonorfyClient,
			buildConstituentCreateData,
			buildConstituentUpdateData,
			buildConstituentPreferencesData,
		} = require("@/app/lib/utils");
		getDonorfyClient.mockReturnValue(mockDonorfy);
		buildConstituentCreateData.mockReturnValue({});
		buildConstituentUpdateData.mockReturnValue({});
		buildConstituentPreferencesData.mockReturnValue({ PreferencesList: [] });

		const addUpdateSubscriber = require("@/app/lib/mailchimp/addUpdateSubscriber");
		addUpdateSubscriber.default = jest.fn().mockResolvedValue(true);

		const addTag = require("@/app/lib/mailchimp/addTag");
		addTag.default = jest.fn().mockResolvedValue(true);

		process.env.VERCEL_ENV = "production";

		const {
			handleBillingRequestFulfilled: importedFunction,
		} = require("@/app/lib/webhookHandlers/goCardless/handleBillingRequestFulfilled");
		handleBillingRequestFulfilled = importedFunction;
	});

	afterEach(() => {
		jest.clearAllMocks();
		consoleLogSpy.mockRestore();
		consoleErrorSpy.mockRestore();
		delete process.env.VERCEL_ENV;
	});

	const createMockEvent = () => ({
		links: {
			billing_request: "BR123",
			customer: "CU123",
			mandate_request_mandate: "MD123",
		},
	});

	const createMockBillingRequest = (additionalDetails = {}) => ({
		metadata: {
			additionalDetails: JSON.stringify({
				title: "Mr",
				firstName: "John",
				lastName: "Doe",
				phone: "1234567890",
				stateCounty: "London",
				campaign: "TestCampaign",
				amount: 50,
				frequency: "monthly",
				directDebitDay: 1,
				giftAid: "true",
				inspirationQuestion: "Why donate?",
				inspirationDetails: "To help",
				preferences: {
					email: true,
					sms: false,
					phone: true,
					post: false,
				},
				...additionalDetails,
			}),
		},
	});

	const createMockCustomer = () => ({
		id: "CU123",
		email: "test@example.com",
		address_line1: "123 Main St",
		address_line2: "Apt 4",
		city: "London",
		postal_code: "SW1A 1AA",
		metadata: {},
	});

	it("should process billing request for new constituent with monthly subscription", async () => {
		const event = createMockEvent();
		const billingRequest = createMockBillingRequest();
		const customer = createMockCustomer();

		mockClient.billingRequests.find.mockResolvedValue(billingRequest);
		mockClient.customers.find.mockResolvedValue(customer);
		mockClient.subscriptions.create.mockResolvedValue({ id: "SB123" });
		mockClient.customers.update.mockResolvedValue({});

		mockDonorfy.duplicateCheck.mockResolvedValue([]);
		mockDonorfy.createConstituent.mockResolvedValue({
			ConstituentId: "CON123",
		});
		mockDonorfy.updateConstituentPreferences.mockResolvedValue(true);
		mockDonorfy.createGiftAidDeclaration.mockResolvedValue(true);
		mockDonorfy.addActiveTags.mockResolvedValue(true);
		mockDonorfy.addActivity.mockResolvedValue(true);

		const result = await handleBillingRequestFulfilled(event);

		expect(result.status).toBe(200);
		expect(result.eventStatus).toBe("processed");
		expect(result.constituentId).toBe("CON123");
		expect(mockClient.subscriptions.create).toHaveBeenCalledWith({
			amount: 5000,
			currency: "GBP",
			name: "Monthly Guardian",
			interval_unit: "monthly",
			day_of_month: 1,
			links: { mandate: "MD123" },
		});
		expect(mockDonorfy.createGiftAidDeclaration).toHaveBeenCalled();
	});

	it("should update existing constituent instead of creating new one", async () => {
		const event = createMockEvent();
		const billingRequest = createMockBillingRequest();
		const customer = createMockCustomer();

		mockClient.billingRequests.find.mockResolvedValue(billingRequest);
		mockClient.customers.find.mockResolvedValue(customer);
		mockClient.subscriptions.create.mockResolvedValue({ id: "SB123" });
		mockClient.customers.update.mockResolvedValue({});

		mockDonorfy.duplicateCheck.mockResolvedValue([
			{ ConstituentId: "CON456", Score: 20 },
		]);
		mockDonorfy.updateConstituent.mockResolvedValue(true);
		mockDonorfy.updateConstituentPreferences.mockResolvedValue(true);
		mockDonorfy.createGiftAidDeclaration.mockResolvedValue(true);
		mockDonorfy.addActiveTags.mockResolvedValue(true);
		mockDonorfy.addActivity.mockResolvedValue(true);

		const result = await handleBillingRequestFulfilled(event);

		expect(result.constituentId).toBe("CON456");
		expect(mockDonorfy.updateConstituent).toHaveBeenCalledWith(
			"CON456",
			expect.any(Object),
		);
		expect(mockDonorfy.createConstituent).not.toHaveBeenCalled();
	});

	it("should skip subscription creation for one-off payment", async () => {
		const event = createMockEvent();
		const billingRequest = createMockBillingRequest({ frequency: "once" });
		const customer = createMockCustomer();

		mockClient.billingRequests.find.mockResolvedValue(billingRequest);
		mockClient.customers.find.mockResolvedValue(customer);
		mockClient.customers.update.mockResolvedValue({});

		mockDonorfy.duplicateCheck.mockResolvedValue([]);
		mockDonorfy.createConstituent.mockResolvedValue({
			ConstituentId: "CON123",
		});
		mockDonorfy.updateConstituentPreferences.mockResolvedValue(true);
		mockDonorfy.addActiveTags.mockResolvedValue(true);
		mockDonorfy.addActivity.mockResolvedValue(true);

		await handleBillingRequestFulfilled(event);

		expect(mockClient.subscriptions.create).not.toHaveBeenCalled();
	});

	it("should skip Gift Aid for non-UK or when giftAid is false", async () => {
		const event = createMockEvent();
		const billingRequest = createMockBillingRequest({
			giftAid: "false",
			frequency: "monthly",
		});
		const customer = createMockCustomer();

		mockClient.billingRequests.find.mockResolvedValue(billingRequest);
		mockClient.customers.find.mockResolvedValue(customer);
		mockClient.subscriptions.create.mockResolvedValue({ id: "SB123" });
		mockClient.customers.update.mockResolvedValue({});

		mockDonorfy.duplicateCheck.mockResolvedValue([]);
		mockDonorfy.createConstituent.mockResolvedValue({
			ConstituentId: "CON123",
		});
		mockDonorfy.updateConstituentPreferences.mockResolvedValue(true);
		mockDonorfy.addActiveTags.mockResolvedValue(true);
		mockDonorfy.addActivity.mockResolvedValue(true);

		await handleBillingRequestFulfilled(event);

		expect(mockDonorfy.createGiftAidDeclaration).not.toHaveBeenCalled();
	});

	it("should add inspiration activity when inspirationDetails provided", async () => {
		const event = createMockEvent();
		const billingRequest = createMockBillingRequest({
			inspirationDetails: "Helping others",
			frequency: "monthly",
		});
		const customer = createMockCustomer();

		mockClient.billingRequests.find.mockResolvedValue(billingRequest);
		mockClient.customers.find.mockResolvedValue(customer);
		mockClient.subscriptions.create.mockResolvedValue({ id: "SB123" });
		mockClient.customers.update.mockResolvedValue({});

		mockDonorfy.duplicateCheck.mockResolvedValue([]);
		mockDonorfy.createConstituent.mockResolvedValue({
			ConstituentId: "CON123",
		});
		mockDonorfy.updateConstituentPreferences.mockResolvedValue(true);
		mockDonorfy.addActiveTags.mockResolvedValue(true);
		mockDonorfy.addActivity.mockResolvedValue(true);

		await handleBillingRequestFulfilled(event);

		expect(mockDonorfy.addActivity).toHaveBeenCalledWith(
			expect.objectContaining({
				ActivityType: "Donation inspiration",
				Notes: "Helping others",
			}),
		);
	});

	it("should handle subscription creation failure", async () => {
		const event = createMockEvent();
		const billingRequest = createMockBillingRequest();
		const customer = createMockCustomer();

		mockClient.billingRequests.find.mockResolvedValue(billingRequest);
		mockClient.customers.find.mockResolvedValue(customer);
		mockClient.subscriptions.create.mockResolvedValue({});

		await expect(handleBillingRequestFulfilled(event)).rejects.toThrow(
			"Failed to create subscription in GoCardless",
		);
	});

	it("should handle confirmation email failure", async () => {
		const event = createMockEvent();
		const billingRequest = createMockBillingRequest();
		const customer = createMockCustomer();

		mockClient.billingRequests.find.mockResolvedValue(billingRequest);
		mockClient.customers.find.mockResolvedValue(customer);
		mockClient.subscriptions.create.mockResolvedValue({ id: "SB123" });

		const sendDirectDebitConfirmationEmail = require("@/app/lib/sparkpost/sendDirectDebitConfirmationEmail");
		sendDirectDebitConfirmationEmail.mockResolvedValue(null);

		await expect(handleBillingRequestFulfilled(event)).rejects.toThrow(
			"Failed to send confirmation email",
		);
	});

	it("should throw error with context on failure", async () => {
		const event = createMockEvent();
		mockClient.billingRequests.find.mockRejectedValue(
			new Error("GoCardless API error"),
		);

		try {
			await handleBillingRequestFulfilled(event);
		} catch (error) {
			expect(error.results).toBeDefined();
			expect(error.goCardlessCustomerId).toBeDefined();
			expect(error.constituentId).toBeDefined();
		}
	});

	it("should skip Mailchimp operations in test environment", async () => {
		process.env.VERCEL_ENV = "development";
		jest.resetModules();

		// Re-setup mocks after resetModules
		const {
			getGoCardlessClient,
		} = require("@/app/lib/gocardless/gocardlessclient");
		getGoCardlessClient.mockReturnValue(mockClient);

		const {
			getDonorfyClient,
			buildConstituentCreateData,
			buildConstituentUpdateData,
			buildConstituentPreferencesData,
		} = require("@/app/lib/utils");
		getDonorfyClient.mockReturnValue(mockDonorfy);
		buildConstituentCreateData.mockReturnValue({});
		buildConstituentUpdateData.mockReturnValue({});
		buildConstituentPreferencesData.mockReturnValue({ PreferencesList: [] });

		const {
			handleBillingRequestFulfilled: testHandleBillingRequestFulfilled,
		} = require("@/app/lib/webhookHandlers/goCardless/handleBillingRequestFulfilled");

		const event = createMockEvent();
		const billingRequest = createMockBillingRequest();
		const customer = createMockCustomer();

		mockClient.billingRequests.find.mockResolvedValue(billingRequest);
		mockClient.customers.find.mockResolvedValue(customer);
		mockClient.subscriptions.create.mockResolvedValue({ id: "SB123" });
		mockClient.customers.update.mockResolvedValue({});

		mockDonorfy.duplicateCheck.mockResolvedValue([]);
		mockDonorfy.createConstituent.mockResolvedValue({
			ConstituentId: "CON123",
		});
		mockDonorfy.updateConstituentPreferences.mockResolvedValue(true);
		mockDonorfy.createGiftAidDeclaration.mockResolvedValue(true);
		mockDonorfy.addActiveTags.mockResolvedValue(true);
		mockDonorfy.addActivity.mockResolvedValue(true);

		const addUpdateSubscriber = require("@/app/lib/mailchimp/addUpdateSubscriber");
		const addTag = require("@/app/lib/mailchimp/addTag");

		await testHandleBillingRequestFulfilled(event);

		expect(addUpdateSubscriber.default).not.toHaveBeenCalled();
		expect(addTag.default).not.toHaveBeenCalled();
	});
});
