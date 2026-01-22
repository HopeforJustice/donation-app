// Mock the GoCardless client module
jest.mock("@/app/lib/gocardless/gocardlessclient");

describe("billingRequest", () => {
	let billingRequest;
	let validateAndTrimAdditionalDetails;
	let getGoCardlessClient;
	let mockClient;
	let consoleLogSpy;

	beforeEach(() => {
		jest.resetModules();

		// Setup mock client
		mockClient = {
			billingRequests: {
				create: jest.fn(),
			},
			billingRequestFlows: {
				create: jest.fn(),
			},
		};

		// Import and setup mock
		const gocardlessModule = require("@/app/lib/gocardless/gocardlessclient");
		getGoCardlessClient = gocardlessModule.getGoCardlessClient;
		getGoCardlessClient.mockReturnValue(mockClient);

		// Import functions under test
		const module = require("@/app/lib/gocardless/billingRequest");
		billingRequest = module.billingRequest;
		validateAndTrimAdditionalDetails = module.validateAndTrimAdditionalDetails;

		// Spy on console.log
		consoleLogSpy = jest.spyOn(console, "log").mockImplementation();

		// Setup environment variables
		process.env.GC_SUCCESS_URL = "https://example.com/success";
		process.env.GC_EXIT_URL = "https://example.com/exit";
	});

	afterEach(() => {
		jest.clearAllMocks();
		consoleLogSpy.mockRestore();
		delete process.env.GC_SUCCESS_URL;
		delete process.env.GC_EXIT_URL;
	});

	describe("validateAndTrimAdditionalDetails", () => {
		it("should return details unchanged when under 500 characters", () => {
			const details = {
				currency: "GBP",
				firstName: "John",
				lastName: "Doe",
				amount: 50,
			};

			const result = validateAndTrimAdditionalDetails(details);

			expect(result).toEqual(details);
			expect(consoleLogSpy).not.toHaveBeenCalled();
		});

		it("should remove UTM parameters first when over limit", () => {
			const details = {
				currency: "GBP",
				firstName: "A".repeat(200),
				lastName: "B".repeat(200),
				amount: 100,
				utmSource: "facebook",
				utmMedium: "social",
				utmCampaign: "spring2026",
			};

			const result = validateAndTrimAdditionalDetails(details);

			expect(result.utmSource).toBeUndefined();
			expect(result.utmMedium).toBeUndefined();
			expect(result.utmCampaign).toBeUndefined();
			expect(result.firstName).toBe("A".repeat(200));
			expect(result.lastName).toBe("B".repeat(200));
			expect(consoleLogSpy).toHaveBeenCalledWith(
				expect.stringContaining("Additional details trimmed to"),
			);
		});

		it("should remove inspiration details after UTM parameters", () => {
			const details = {
				currency: "GBP",
				firstName: "A".repeat(200),
				lastName: "B".repeat(200),
				amount: 100,
				inspirationDetails: "C".repeat(100),
			};

			const result = validateAndTrimAdditionalDetails(details);

			expect(result.inspirationDetails).toBeUndefined();
			expect(result.firstName).toBe("A".repeat(200));
		});

		it("should remove inspiration question after inspiration details", () => {
			const details = {
				currency: "GBP",
				firstName: "A".repeat(200),
				lastName: "B".repeat(200),
				amount: 100,
				inspirationQuestion: "What inspired you?",
			};

			const result = validateAndTrimAdditionalDetails(details);

			expect(result.inspirationQuestion).toBeUndefined();
			expect(result.firstName).toBe("A".repeat(200));
		});

		it("should throw error when still over limit after all removals", () => {
			const details = {
				currency: "GBP",
				firstName: "A".repeat(300),
				lastName: "B".repeat(300),
				amount: 100,
			};

			expect(() => validateAndTrimAdditionalDetails(details)).toThrow(
				"Additional details still exceed 500 character limit",
			);
		});

		it("should not mutate original details object", () => {
			const details = {
				currency: "GBP",
				firstName: "A".repeat(200),
				lastName: "B".repeat(200),
				utmSource: "test",
			};
			const originalDetails = { ...details };

			validateAndTrimAdditionalDetails(details);

			expect(details).toEqual(originalDetails);
		});
	});

	describe("billingRequest", () => {
		const mockFormData = {
			currency: "GBP",
			title: "Mr",
			firstName: "John",
			lastName: "Doe",
			email: "john@example.com",
			phone: "07123456789",
			address1: "123 Main St",
			address2: "Apt 4",
			townCity: "London",
			postcode: "SW1A 1AA",
			stateCounty: "Greater London",
			campaign: "Annual Fund",
			amount: 50,
			directDebitStartDate: "1",
			givingFrequency: "monthly",
			smsPreference: true,
			postPreference: false,
			phonePreference: true,
			emailPreference: true,
			giftAid: true,
			inspirationQuestion: "What inspired you?",
			inspirationDetails: "Wanted to help",
			utm_source: "website",
			utm_medium: "organic",
			utm_campaign: "winter2026",
		};

		it("should create billing request and flow successfully", async () => {
			const mockBillingRequest = { id: "BR123" };
			const mockBillingRequestFlow = {
				authorisation_url: "https://gocardless.com/auth/BR123",
			};

			mockClient.billingRequests.create.mockResolvedValue(mockBillingRequest);
			mockClient.billingRequestFlows.create.mockResolvedValue(
				mockBillingRequestFlow,
			);

			const result = await billingRequest(mockFormData);

			expect(mockClient.billingRequests.create).toHaveBeenCalledWith({
				mandate_request: {
					scheme: "bacs",
				},
				metadata: {
					additionalDetails: expect.any(String),
				},
			});

			expect(mockClient.billingRequestFlows.create).toHaveBeenCalledWith({
				redirect_uri: expect.stringContaining("https://example.com/success"),
				exit_uri: "https://example.com/exit",
				prefilled_customer: {
					given_name: "John",
					family_name: "Doe",
					email: "john@example.com",
					address_line1: "123 Main St",
					address_line2: "Apt 4",
					city: "London",
					postal_code: "SW1A 1AA",
				},
				links: {
					billing_request: "BR123",
				},
			});

			expect(result).toEqual({
				authorisationUrl: "https://gocardless.com/auth/BR123",
			});
		});

		it("should include all form data in additional details", async () => {
			const mockBillingRequest = { id: "BR123" };
			const mockBillingRequestFlow = {
				authorisation_url: "https://gocardless.com/auth/BR123",
			};

			mockClient.billingRequests.create.mockResolvedValue(mockBillingRequest);
			mockClient.billingRequestFlows.create.mockResolvedValue(
				mockBillingRequestFlow,
			);

			await billingRequest(mockFormData);

			const createCall = mockClient.billingRequests.create.mock.calls[0][0];
			const additionalDetails = JSON.parse(
				createCall.metadata.additionalDetails,
			);

			expect(additionalDetails).toEqual(
				expect.objectContaining({
					currency: "GBP",
					title: "Mr",
					firstName: "John",
					lastName: "Doe",
					phone: "07123456789",
					campaign: "Annual Fund",
					amount: 50,
					stateCounty: "Greater London",
					directDebitDay: "1",
					frequency: "monthly",
					preferences: {
						sms: true,
						post: false,
						phone: true,
						email: true,
					},
					giftAid: true,
					inspirationQuestion: "What inspired you?",
					inspirationDetails: "Wanted to help",
					utmSource: "website",
					utmMedium: "organic",
					utmCampaign: "winter2026",
				}),
			);
		});

		it("should use default utm values when not provided", async () => {
			const dataWithoutUTM = { ...mockFormData };
			delete dataWithoutUTM.utm_source;
			delete dataWithoutUTM.utm_medium;
			delete dataWithoutUTM.utm_campaign;

			const mockBillingRequest = { id: "BR123" };
			const mockBillingRequestFlow = {
				authorisation_url: "https://gocardless.com/auth/BR123",
			};

			mockClient.billingRequests.create.mockResolvedValue(mockBillingRequest);
			mockClient.billingRequestFlows.create.mockResolvedValue(
				mockBillingRequestFlow,
			);

			await billingRequest(dataWithoutUTM);

			const createCall = mockClient.billingRequests.create.mock.calls[0][0];
			const additionalDetails = JSON.parse(
				createCall.metadata.additionalDetails,
			);

			expect(additionalDetails.utmSource).toBe("unknown");
			expect(additionalDetails.utmMedium).toBe("unknown");
			expect(additionalDetails.utmCampaign).toBe("unknown");
		});

		it("should construct success URL with query parameters", async () => {
			const mockBillingRequest = { id: "BR123" };
			const mockBillingRequestFlow = {
				authorisation_url: "https://gocardless.com/auth/BR123",
			};

			mockClient.billingRequests.create.mockResolvedValue(mockBillingRequest);
			mockClient.billingRequestFlows.create.mockResolvedValue(
				mockBillingRequestFlow,
			);

			await billingRequest(mockFormData);

			const flowCall = mockClient.billingRequestFlows.create.mock.calls[0][0];
			expect(flowCall.redirect_uri).toContain("name=John");
			expect(flowCall.redirect_uri).toContain("amount=50");
			expect(flowCall.redirect_uri).toContain("frequency=monthly");
			expect(flowCall.redirect_uri).toContain("gateway=gocardless");
			expect(flowCall.redirect_uri).toContain("currency=GBP");
		});

		it("should throw error when billing request creation fails", async () => {
			mockClient.billingRequests.create.mockResolvedValue(null);

			await expect(billingRequest(mockFormData)).rejects.toThrow(
				"Error creating billing request:",
			);

			expect(mockClient.billingRequestFlows.create).not.toHaveBeenCalled();
		});

		it("should throw error when billing request flow creation fails", async () => {
			const mockBillingRequest = { id: "BR123" };
			mockClient.billingRequests.create.mockResolvedValue(mockBillingRequest);
			mockClient.billingRequestFlows.create.mockResolvedValue(null);

			await expect(billingRequest(mockFormData)).rejects.toThrow(
				"Error creating billing request:",
			);
		});

		it("should throw error when API calls fail", async () => {
			mockClient.billingRequests.create.mockRejectedValue(
				new Error("API Error"),
			);

			await expect(billingRequest(mockFormData)).rejects.toThrow(
				"Error creating billing request:",
			);
		});

		it("should log billing request flow on success", async () => {
			const mockBillingRequest = { id: "BR123" };
			const mockBillingRequestFlow = {
				authorisation_url: "https://gocardless.com/auth/BR123",
			};

			mockClient.billingRequests.create.mockResolvedValue(mockBillingRequest);
			mockClient.billingRequestFlows.create.mockResolvedValue(
				mockBillingRequestFlow,
			);

			await billingRequest(mockFormData);

			expect(consoleLogSpy).toHaveBeenCalledWith("creating billing request...");
			expect(consoleLogSpy).toHaveBeenCalledWith(
				"billing request flow:",
				mockBillingRequestFlow,
			);
		});

		it("should trim additional details when they exceed 500 characters", async () => {
			const largeData = {
				...mockFormData,
				firstName: "A".repeat(100),
				lastName: "B".repeat(100),
			};

			const mockBillingRequest = { id: "BR123" };
			const mockBillingRequestFlow = {
				authorisation_url: "https://gocardless.com/auth/BR123",
			};

			mockClient.billingRequests.create.mockResolvedValue(mockBillingRequest);
			mockClient.billingRequestFlows.create.mockResolvedValue(
				mockBillingRequestFlow,
			);

			await billingRequest(largeData);

			const createCall = mockClient.billingRequests.create.mock.calls[0][0];
			const additionalDetailsString = createCall.metadata.additionalDetails;

			expect(additionalDetailsString.length).toBeLessThanOrEqual(500);
			expect(consoleLogSpy).toHaveBeenCalledWith(
				expect.stringContaining("Additional details trimmed to"),
			);
		});
	});
});
