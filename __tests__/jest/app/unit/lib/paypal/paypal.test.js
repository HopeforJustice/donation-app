// Mock the PayPal-related modules
jest.mock("@/app/lib/utils");
jest.mock("@/app/lib/mailchimp/addUpdateSubscriber");

describe("PayPal Functions", () => {
	let consoleLogSpy;
	let consoleErrorSpy;

	beforeEach(() => {
		// Spy on console methods
		consoleLogSpy = jest.spyOn(console, "log").mockImplementation();
		consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
	});

	afterEach(() => {
		jest.clearAllMocks();
		consoleLogSpy.mockRestore();
		consoleErrorSpy.mockRestore();
	});

	describe("getPayPalCredentials", () => {
		let getPayPalCredentials;

		beforeEach(() => {
			jest.resetModules();
			jest.unmock("@/app/lib/paypal/getPayPalCredentials");

			// Set up environment variables
			process.env.NEXT_PUBLIC_PAYPAL_US_SANDBOX_CLIENT_ID =
				"us-sandbox-client-id";
			process.env.PAYPAL_US_SANDBOX_SECRET = "us-sandbox-secret";
			process.env.NEXT_PUBLIC_PAYPAL_US_LIVE_CLIENT_ID = "us-live-client-id";
			process.env.PAYPAL_US_LIVE_SECRET = "us-live-secret";
			process.env.NEXT_PUBLIC_PAYPAL_UK_SANDBOX_CLIENT_ID =
				"uk-sandbox-client-id";
			process.env.PAYPAL_UK_SANDBOX_SECRET = "uk-sandbox-secret";
			process.env.NEXT_PUBLIC_PAYPAL_UK_LIVE_CLIENT_ID = "uk-live-client-id";
			process.env.PAYPAL_UK_LIVE_SECRET = "uk-live-secret";

			const module = require("@/app/lib/paypal/getPayPalCredentials");
			getPayPalCredentials = module.getPayPalCredentials;
		});

		afterEach(() => {
			delete process.env.NEXT_PUBLIC_PAYPAL_US_SANDBOX_CLIENT_ID;
			delete process.env.PAYPAL_US_SANDBOX_SECRET;
			delete process.env.NEXT_PUBLIC_PAYPAL_US_LIVE_CLIENT_ID;
			delete process.env.PAYPAL_US_LIVE_SECRET;
			delete process.env.NEXT_PUBLIC_PAYPAL_UK_SANDBOX_CLIENT_ID;
			delete process.env.PAYPAL_UK_SANDBOX_SECRET;
			delete process.env.NEXT_PUBLIC_PAYPAL_UK_LIVE_CLIENT_ID;
			delete process.env.PAYPAL_UK_LIVE_SECRET;
		});

		it("should get US sandbox credentials for USD currency", () => {
			const result = getPayPalCredentials("USD", "test");

			expect(result).toEqual({
				clientId: "us-sandbox-client-id",
				clientSecret: "us-sandbox-secret",
			});
			expect(consoleLogSpy).toHaveBeenCalledWith(
				"Getting PayPal credentials for US SANDBOX",
			);
		});

		it("should get US live credentials for USD in live mode", () => {
			const result = getPayPalCredentials("USD", "live");

			expect(result).toEqual({
				clientId: "us-live-client-id",
				clientSecret: "us-live-secret",
			});
			expect(consoleLogSpy).toHaveBeenCalledWith(
				"Getting PayPal credentials for US LIVE",
			);
		});

		it("should get UK sandbox credentials for GBP currency", () => {
			const result = getPayPalCredentials("GBP", "test");

			expect(result).toEqual({
				clientId: "uk-sandbox-client-id",
				clientSecret: "uk-sandbox-secret",
			});
			expect(consoleLogSpy).toHaveBeenCalledWith(
				"Getting PayPal credentials for UK SANDBOX",
			);
		});

		it("should get UK live credentials for GBP in live mode", () => {
			const result = getPayPalCredentials("GBP", "live");

			expect(result).toEqual({
				clientId: "uk-live-client-id",
				clientSecret: "uk-live-secret",
			});
			expect(consoleLogSpy).toHaveBeenCalledWith(
				"Getting PayPal credentials for UK LIVE",
			);
		});

		it("should throw error when credentials are missing", () => {
			delete process.env.NEXT_PUBLIC_PAYPAL_US_SANDBOX_CLIENT_ID;

			expect(() => getPayPalCredentials("USD", "test")).toThrow(
				"PayPal credentials not configured for USD in test mode (US SANDBOX)",
			);
		});

		it("should handle case-insensitive currency", () => {
			const result = getPayPalCredentials("usd", "test");

			expect(result.clientId).toBe("us-sandbox-client-id");
		});
	});

	describe("getPayPalClientId", () => {
		let getPayPalClientId;

		beforeEach(() => {
			jest.resetModules();
			jest.unmock("@/app/lib/paypal/getPayPalCredentials");

			process.env.NEXT_PUBLIC_PAYPAL_US_SANDBOX_CLIENT_ID =
				"us-sandbox-client-id";
			process.env.PAYPAL_US_SANDBOX_SECRET = "us-sandbox-secret";

			const module = require("@/app/lib/paypal/getPayPalCredentials");
			getPayPalClientId = module.getPayPalClientId;
		});

		afterEach(() => {
			delete process.env.NEXT_PUBLIC_PAYPAL_US_SANDBOX_CLIENT_ID;
			delete process.env.PAYPAL_US_SANDBOX_SECRET;
		});

		it("should return only the client ID", () => {
			const result = getPayPalClientId("USD", "test");

			expect(result).toBe("us-sandbox-client-id");
		});
	});

	describe("getPayPalBaseUrl", () => {
		let getPayPalBaseUrl;

		beforeEach(() => {
			jest.resetModules();
			jest.unmock("@/app/lib/paypal/getPayPalCredentials");

			const module = require("@/app/lib/paypal/getPayPalCredentials");
			getPayPalBaseUrl = module.getPayPalBaseUrl;
		});

		it("should return sandbox URL for test mode", () => {
			const result = getPayPalBaseUrl("test");

			expect(result).toBe("https://api-m.sandbox.paypal.com");
		});

		it("should return live URL for live mode", () => {
			const result = getPayPalBaseUrl("live");

			expect(result).toBe("https://api-m.paypal.com");
		});

		it("should default to sandbox URL", () => {
			const result = getPayPalBaseUrl();

			expect(result).toBe("https://api-m.sandbox.paypal.com");
		});
	});

	describe("getPayPalAccessToken", () => {
		let getPayPalAccessToken;
		let fetchMock;

		beforeEach(() => {
			jest.resetModules();
			jest.unmock("@/app/lib/paypal/getPayPalAccessToken");
			jest.unmock("@/app/lib/paypal/getPayPalCredentials");

			process.env.NEXT_PUBLIC_PAYPAL_US_SANDBOX_CLIENT_ID = "test-client-id";
			process.env.PAYPAL_US_SANDBOX_SECRET = "test-secret";

			// Mock global fetch
			fetchMock = jest.fn();
			global.fetch = fetchMock;

			getPayPalAccessToken =
				require("@/app/lib/paypal/getPayPalAccessToken").getPayPalAccessToken;
		});

		afterEach(() => {
			delete process.env.NEXT_PUBLIC_PAYPAL_US_SANDBOX_CLIENT_ID;
			delete process.env.PAYPAL_US_SANDBOX_SECRET;
			delete global.fetch;
		});

		it("should get access token successfully", async () => {
			const mockAccessToken = "mock-access-token-12345";
			fetchMock.mockResolvedValue({
				ok: true,
				json: async () => ({ access_token: mockAccessToken }),
			});

			const result = await getPayPalAccessToken("USD", "test");

			expect(result).toBe(mockAccessToken);
			expect(fetchMock).toHaveBeenCalledWith(
				"https://api-m.sandbox.paypal.com/v1/oauth2/token",
				expect.objectContaining({
					method: "POST",
					headers: expect.objectContaining({
						Authorization: expect.stringContaining("Basic "),
						"Content-Type": "application/x-www-form-urlencoded",
					}),
					body: "grant_type=client_credentials",
				}),
			);
		});

		it("should throw error when API request fails", async () => {
			fetchMock.mockResolvedValue({
				ok: false,
				text: async () => "Authentication failed",
			});

			await expect(getPayPalAccessToken("USD", "test")).rejects.toThrow(
				"Failed to get PayPal access token",
			);
		});

		it("should encode credentials in base64", async () => {
			fetchMock.mockResolvedValue({
				ok: true,
				json: async () => ({ access_token: "token" }),
			});

			await getPayPalAccessToken("USD", "test");

			const authHeader = fetchMock.mock.calls[0][1].headers.Authorization;
			const encodedCreds = authHeader.replace("Basic ", "");
			const decodedCreds = Buffer.from(encodedCreds, "base64").toString();

			expect(decodedCreds).toBe("test-client-id:test-secret");
		});
	});

	describe("createPayPalOrder", () => {
		let createPayPalOrder;
		let fetchMock;

		beforeEach(() => {
			jest.resetModules();
			jest.unmock("@/app/lib/paypal/createPayPalOrder");
			jest.unmock("@/app/lib/paypal/getPayPalAccessToken");
			jest.unmock("@/app/lib/paypal/getPayPalCredentials");

			process.env.NEXT_PUBLIC_PAYPAL_US_SANDBOX_CLIENT_ID = "test-client-id";
			process.env.PAYPAL_US_SANDBOX_SECRET = "test-secret";
			process.env.NEXT_PUBLIC_API_URL = "https://example.com";

			fetchMock = jest.fn();
			global.fetch = fetchMock;

			createPayPalOrder =
				require("@/app/lib/paypal/createPayPalOrder").createPayPalOrder;
		});

		afterEach(() => {
			delete process.env.NEXT_PUBLIC_PAYPAL_US_SANDBOX_CLIENT_ID;
			delete process.env.PAYPAL_US_SANDBOX_SECRET;
			delete process.env.NEXT_PUBLIC_API_URL;
			delete global.fetch;
		});

		it("should create PayPal order successfully", async () => {
			const mockOrderId = "ORDER123456";
			const mockOrderData = {
				id: mockOrderId,
				status: "CREATED",
				links: [{ rel: "approve", href: "https://paypal.com/approve" }],
			};

			// First call: auth token, second call: create order
			fetchMock
				.mockResolvedValueOnce({
					ok: true,
					json: async () => ({ access_token: "mock-token" }),
				})
				.mockResolvedValueOnce({
					ok: true,
					json: async () => mockOrderData,
				});

			const result = await createPayPalOrder({
				amount: 50,
				currency: "USD",
				mode: "test",
				formData: {},
			});

			expect(result).toEqual({
				orderID: mockOrderId,
				orderData: mockOrderData,
			});
			expect(fetchMock).toHaveBeenCalledTimes(2);
			expect(fetchMock.mock.calls[1][0]).toContain("/v2/checkout/orders");
		});

		it("should include correct order payload structure", async () => {
			// Add UK credentials
			process.env.NEXT_PUBLIC_PAYPAL_UK_SANDBOX_CLIENT_ID = "uk-test-client-id";
			process.env.PAYPAL_UK_SANDBOX_SECRET = "uk-test-secret";

			fetchMock
				.mockResolvedValueOnce({
					ok: true,
					json: async () => ({ access_token: "mock-token" }),
				})
				.mockResolvedValueOnce({
					ok: true,
					json: async () => ({ id: "ORDER123" }),
				});

			await createPayPalOrder({
				amount: 100,
				currency: "GBP",
				mode: "test",
				formData: {},
			});

			delete process.env.NEXT_PUBLIC_PAYPAL_UK_SANDBOX_CLIENT_ID;
			delete process.env.PAYPAL_UK_SANDBOX_SECRET;

			const orderPayload = JSON.parse(fetchMock.mock.calls[1][1].body);

			expect(orderPayload).toMatchObject({
				intent: "CAPTURE",
				purchase_units: [
					{
						description: "One-time donation",
						amount: {
							currency_code: "GBP",
							value: "100",
						},
					},
				],
				payment_source: {
					paypal: {
						experience_context: {
							payment_method_preference: "IMMEDIATE_PAYMENT_REQUIRED",
							brand_name: "Hope for Justice",
							user_action: "PAY_NOW",
						},
					},
				},
			});
		});

		it("should throw error when order creation fails", async () => {
			fetchMock
				.mockResolvedValueOnce({
					ok: true,
					json: async () => ({ access_token: "mock-token" }),
				})
				.mockResolvedValueOnce({
					ok: false,
					json: async () => ({ error: "Invalid request" }),
				});

			await expect(
				createPayPalOrder({
					amount: 50,
					currency: "USD",
					mode: "test",
					formData: {},
				}),
			).rejects.toThrow("Failed to create PayPal order");
		});
	});

	describe("capturePayPalOrder", () => {
		let capturePayPalOrder;
		let fetchMock;

		beforeEach(() => {
			jest.resetModules();
			jest.unmock("@/app/lib/paypal/capturePayPalOrder");
			jest.unmock("@/app/lib/paypal/getPayPalAccessToken");
			jest.unmock("@/app/lib/paypal/getPayPalCredentials");

			process.env.NEXT_PUBLIC_PAYPAL_US_SANDBOX_CLIENT_ID = "test-client-id";
			process.env.PAYPAL_US_SANDBOX_SECRET = "test-secret";

			fetchMock = jest.fn();
			global.fetch = fetchMock;

			capturePayPalOrder =
				require("@/app/lib/paypal/capturePayPalOrder").capturePayPalOrder;
		});

		afterEach(() => {
			delete process.env.NEXT_PUBLIC_PAYPAL_US_SANDBOX_CLIENT_ID;
			delete process.env.PAYPAL_US_SANDBOX_SECRET;
			delete global.fetch;
		});

		it("should capture PayPal order successfully", async () => {
			const mockCaptureData = {
				id: "ORDER123",
				status: "COMPLETED",
				purchase_units: [
					{
						payments: {
							captures: [
								{
									id: "CAPTURE123",
									status: "COMPLETED",
									amount: { value: "50.00", currency_code: "USD" },
									create_time: "2026-01-22T12:00:00Z",
									update_time: "2026-01-22T12:00:00Z",
								},
							],
						},
					},
				],
				payment_source: {
					paypal: {},
				},
			};

			fetchMock
				.mockResolvedValueOnce({
					ok: true,
					json: async () => ({ access_token: "mock-token" }),
				})
				.mockResolvedValueOnce({
					ok: true,
					json: async () => mockCaptureData,
				});

			const result = await capturePayPalOrder({
				orderID: "ORDER123",
				mode: "test",
				formData: { currency: "USD" },
			});

			expect(result).toEqual({
				success: true,
				orderID: "ORDER123",
				captureID: "CAPTURE123",
				paymentDetails: {
					paypalOrderId: "ORDER123",
					paypalCaptureId: "CAPTURE123",
					amount: 50,
					currency: "USD",
					status: "COMPLETED",
					createTime: "2026-01-22T12:00:00Z",
					updateTime: "2026-01-22T12:00:00Z",
					fundingSource: "paypal",
					paymentMethod: "PayPal",
				},
			});
		});

		it("should detect Venmo funding source", async () => {
			const mockCaptureData = {
				id: "ORDER123",
				status: "COMPLETED",
				purchase_units: [
					{
						payments: {
							captures: [
								{
									id: "CAPTURE123",
									status: "COMPLETED",
									amount: { value: "25.00", currency_code: "USD" },
									create_time: "2026-01-22T12:00:00Z",
									update_time: "2026-01-22T12:00:00Z",
								},
							],
						},
					},
				],
				payment_source: {
					venmo: {},
				},
			};

			fetchMock
				.mockResolvedValueOnce({
					ok: true,
					json: async () => ({ access_token: "mock-token" }),
				})
				.mockResolvedValueOnce({
					ok: true,
					json: async () => mockCaptureData,
				});

			const result = await capturePayPalOrder({
				orderID: "ORDER123",
				mode: "test",
				formData: { currency: "USD" },
			});

			expect(result.paymentDetails.fundingSource).toBe("venmo");
			expect(result.paymentDetails.paymentMethod).toBe("Venmo");
		});

		it("should throw error when capture fails", async () => {
			fetchMock
				.mockResolvedValueOnce({
					ok: true,
					json: async () => ({ access_token: "mock-token" }),
				})
				.mockResolvedValueOnce({
					ok: false,
					json: async () => ({ error: "Capture failed" }),
				});

			await expect(
				capturePayPalOrder({
					orderID: "ORDER123",
					mode: "test",
					formData: { currency: "USD" },
				}),
			).rejects.toThrow("Failed to capture PayPal payment");
		});

		it("should throw error when capture status is not COMPLETED", async () => {
			const mockCaptureData = {
				id: "ORDER123",
				status: "PENDING",
				purchase_units: [
					{
						payments: {
							captures: [
								{
									id: "CAPTURE123",
									status: "PENDING",
									amount: { value: "50.00", currency_code: "USD" },
									create_time: "2026-01-22T12:00:00Z",
									update_time: "2026-01-22T12:00:00Z",
								},
							],
						},
					},
				],
			};

			fetchMock
				.mockResolvedValueOnce({
					ok: true,
					json: async () => ({ access_token: "mock-token" }),
				})
				.mockResolvedValueOnce({
					ok: true,
					json: async () => mockCaptureData,
				});

			await expect(
				capturePayPalOrder({
					orderID: "ORDER123",
					mode: "test",
					formData: { currency: "USD" },
				}),
			).rejects.toThrow("PayPal payment capture was not completed");
		});
	});

	describe("processPayPalDonation", () => {
		let processPayPalDonation;
		let getDonorfyClient;
		let addUpdateSubscriber;
		let mockDonorfy;

		beforeEach(() => {
			jest.resetModules();
			jest.unmock("@/app/lib/paypal/processPayPalDonation");

			// Setup mock Donorfy client
			mockDonorfy = {
				duplicateCheck: jest.fn(),
				createConstituent: jest.fn(),
				updateConstituent: jest.fn(),
				updateConstituentPreferences: jest.fn(),
				createTransaction: jest.fn(),
				addActivity: jest.fn(),
				addActiveTags: jest.fn(),
				createGiftAidDeclaration: jest.fn(),
			};

			getDonorfyClient = require("@/app/lib/utils").getDonorfyClient;
			getDonorfyClient.mockReturnValue(mockDonorfy);

			// Get the mocked addUpdateSubscriber
			addUpdateSubscriber =
				require("@/app/lib/mailchimp/addUpdateSubscriber").default;
			addUpdateSubscriber.mockResolvedValue({});

			processPayPalDonation =
				require("@/app/lib/paypal/processPayPalDonation").processPayPalDonation;

			process.env.VERCEL_ENV = "production"; // Ensure not in test mode for Mailchimp
		});

		afterEach(() => {
			delete process.env.VERCEL_ENV;
		});

		it("should create new constituent when not found in Donorfy", async () => {
			mockDonorfy.duplicateCheck.mockResolvedValue([]);
			mockDonorfy.createConstituent.mockResolvedValue({
				ConstituentId: "CONST123",
			});
			mockDonorfy.updateConstituentPreferences.mockResolvedValue({});
			mockDonorfy.createTransaction.mockResolvedValue({ Id: "TRANS123" });

			const formData = {
				email: "test@example.com",
				firstName: "John",
				lastName: "Doe",
				campaign: "Test Campaign",
				emailPreference: "true",
			};

			const result = await processPayPalDonation({
				orderID: "ORDER123",
				captureID: "CAPTURE123",
				amount: 50,
				currency: "USD",
				formData,
				mode: "test",
			});

			expect(result.success).toBe(true);
			expect(result.constituentId).toBe("CONST123");
			expect(result.transactionId).toBe("TRANS123");
			expect(mockDonorfy.createConstituent).toHaveBeenCalledWith(
				expect.objectContaining({
					ConstituentType: "individual",
					FirstName: "John",
					LastName: "Doe",
					EmailAddress: "test@example.com",
				}),
			);
		});

		it("should update existing constituent when found in Donorfy", async () => {
			mockDonorfy.duplicateCheck.mockResolvedValue([
				{ ConstituentId: "EXISTING123", Score: 20 },
			]);
			mockDonorfy.createTransaction.mockResolvedValue({ Id: "TRANS123" });

			const formData = {
				email: "existing@example.com",
				firstName: "Jane",
				lastName: "Smith",
				campaign: "Test Campaign",
			};

			const result = await processPayPalDonation({
				orderID: "ORDER123",
				captureID: "CAPTURE123",
				amount: 100,
				currency: "GBP",
				formData,
				mode: "test",
			});

			expect(result.success).toBe(true);
			expect(result.constituentId).toBe("EXISTING123");
			expect(mockDonorfy.updateConstituent).toHaveBeenCalledWith(
				"EXISTING123",
				expect.objectContaining({
					FirstName: "Jane",
					LastName: "Smith",
				}),
			);
			expect(mockDonorfy.createConstituent).not.toHaveBeenCalled();
		});

		it("should use UK Donorfy instance for GBP", async () => {
			mockDonorfy.duplicateCheck.mockResolvedValue([]);
			mockDonorfy.createConstituent.mockResolvedValue({
				ConstituentId: "CONST123",
			});
			mockDonorfy.createTransaction.mockResolvedValue({ Id: "TRANS123" });

			await processPayPalDonation({
				orderID: "ORDER123",
				captureID: "CAPTURE123",
				amount: 50,
				currency: "GBP",
				formData: { email: "test@example.com", campaign: "Test" },
				mode: "test",
			});

			expect(getDonorfyClient).toHaveBeenCalledWith("uk");
		});

		it("should use US Donorfy instance for USD", async () => {
			mockDonorfy.duplicateCheck.mockResolvedValue([]);
			mockDonorfy.createConstituent.mockResolvedValue({
				ConstituentId: "CONST123",
			});
			mockDonorfy.createTransaction.mockResolvedValue({ Id: "TRANS123" });

			await processPayPalDonation({
				orderID: "ORDER123",
				captureID: "CAPTURE123",
				amount: 50,
				currency: "USD",
				formData: { email: "test@example.com", campaign: "Test" },
				mode: "test",
			});

			expect(getDonorfyClient).toHaveBeenCalledWith("us");
		});

		it("should add inspiration activity when provided", async () => {
			mockDonorfy.duplicateCheck.mockResolvedValue([]);
			mockDonorfy.createConstituent.mockResolvedValue({
				ConstituentId: "CONST123",
			});
			mockDonorfy.createTransaction.mockResolvedValue({ Id: "TRANS123" });

			const formData = {
				email: "test@example.com",
				campaign: "Test",
				inspirationDetails: "Inspired by a friend",
			};

			await processPayPalDonation({
				orderID: "ORDER123",
				captureID: "CAPTURE123",
				amount: 50,
				currency: "USD",
				formData,
				mode: "test",
			});

			expect(mockDonorfy.addActivity).toHaveBeenCalledWith({
				ExistingConstituentId: "CONST123",
				ActivityType: "Donation inspiration",
				Notes: "Inspired by a friend",
			});
		});

		it("should add inspiration tag when provided", async () => {
			mockDonorfy.duplicateCheck.mockResolvedValue([]);
			mockDonorfy.createConstituent.mockResolvedValue({
				ConstituentId: "CONST123",
			});
			mockDonorfy.createTransaction.mockResolvedValue({ Id: "TRANS123" });

			const formData = {
				email: "test@example.com",
				campaign: "Test",
				inspiration: "Friend",
			};

			await processPayPalDonation({
				orderID: "ORDER123",
				captureID: "CAPTURE123",
				amount: 50,
				currency: "USD",
				formData,
				mode: "test",
			});

			expect(mockDonorfy.addActiveTags).toHaveBeenCalledWith(
				"CONST123",
				"Friend",
			);
		});

		it("should create Gift Aid declaration for UK donations with giftAid flag", async () => {
			mockDonorfy.duplicateCheck.mockResolvedValue([]);
			mockDonorfy.createConstituent.mockResolvedValue({
				ConstituentId: "CONST123",
			});
			mockDonorfy.createTransaction.mockResolvedValue({ Id: "TRANS123" });

			const formData = {
				email: "test@example.com",
				campaign: "Test",
				giftAid: "true",
				title: "Mr",
				firstName: "John",
				lastName: "Doe",
			};

			await processPayPalDonation({
				orderID: "ORDER123",
				captureID: "CAPTURE123",
				amount: 50,
				currency: "GBP",
				formData,
				mode: "test",
			});

			expect(mockDonorfy.createGiftAidDeclaration).toHaveBeenCalledWith(
				"CONST123",
				{
					TaxPayerTitle: "Mr",
					TaxPayerFirstName: "John",
					TaxPayerLastName: "Doe",
				},
			);
		});

		it("should not create Gift Aid for US donations", async () => {
			mockDonorfy.duplicateCheck.mockResolvedValue([]);
			mockDonorfy.createConstituent.mockResolvedValue({
				ConstituentId: "CONST123",
			});
			mockDonorfy.createTransaction.mockResolvedValue({ Id: "TRANS123" });

			const formData = {
				email: "test@example.com",
				campaign: "Test",
				giftAid: "true",
				firstName: "John",
				lastName: "Doe",
			};

			await processPayPalDonation({
				orderID: "ORDER123",
				captureID: "CAPTURE123",
				amount: 50,
				currency: "USD",
				formData,
				mode: "test",
			});

			expect(mockDonorfy.createGiftAidDeclaration).not.toHaveBeenCalled();
		});

		it("should add to Mailchimp when email preference is true", async () => {
			mockDonorfy.duplicateCheck.mockResolvedValue([]);
			mockDonorfy.createConstituent.mockResolvedValue({
				ConstituentId: "CONST123",
			});
			mockDonorfy.updateConstituentPreferences.mockResolvedValue({});
			mockDonorfy.createTransaction.mockResolvedValue({ Id: "TRANS123" });

			const formData = {
				email: "test@example.com",
				firstName: "John",
				lastName: "Doe",
				campaign: "Test",
				emailPreference: "true",
			};

			await processPayPalDonation({
				orderID: "ORDER123",
				captureID: "CAPTURE123",
				amount: 50,
				currency: "GBP",
				formData,
				mode: "test",
			});

			expect(addUpdateSubscriber).toHaveBeenCalledWith(
				"test@example.com",
				"John",
				"Doe",
				"subscribed",
				"uk",
				undefined,
			);
		});

		it("should add organisation to Mailchimp merge fields when provided", async () => {
			mockDonorfy.duplicateCheck.mockResolvedValue([]);
			mockDonorfy.createConstituent.mockResolvedValue({
				ConstituentId: "CONST123",
			});
			mockDonorfy.updateConstituentPreferences.mockResolvedValue({});
			mockDonorfy.createTransaction.mockResolvedValue({ Id: "TRANS123" });

			const formData = {
				email: "test@example.com",
				firstName: "John",
				lastName: "Doe",
				campaign: "Test",
				emailPreference: "true",
				organisationName: "Test Org",
			};

			await processPayPalDonation({
				orderID: "ORDER123",
				captureID: "CAPTURE123",
				amount: 50,
				currency: "USD",
				formData,
				mode: "test",
			});

			expect(addUpdateSubscriber).toHaveBeenCalledWith(
				"test@example.com",
				"John",
				"Doe",
				"subscribed",
				"us",
				{ ORG: "Test Org" },
			);
		});

		it("should handle errors gracefully and return failure", async () => {
			mockDonorfy.duplicateCheck.mockRejectedValue(
				new Error("Donorfy API error"),
			);

			const result = await processPayPalDonation({
				orderID: "ORDER123",
				captureID: "CAPTURE123",
				amount: 50,
				currency: "USD",
				formData: { email: "test@example.com", campaign: "Test" },
				mode: "test",
			});

			expect(result.success).toBe(false);
			expect(result.error).toBe("Donorfy API error");
			expect(result.results).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						step: "Check for duplicate in Donorfy",
						success: false,
						error: "Donorfy API error",
					}),
				]),
			);
		});

		it("should update US preferences correctly (all true by default)", async () => {
			mockDonorfy.duplicateCheck.mockResolvedValue([]);
			mockDonorfy.createConstituent.mockResolvedValue({
				ConstituentId: "CONST123",
			});
			mockDonorfy.createTransaction.mockResolvedValue({ Id: "TRANS123" });

			const formData = {
				email: "test@example.com",
				campaign: "Test",
			};

			await processPayPalDonation({
				orderID: "ORDER123",
				captureID: "CAPTURE123",
				amount: 50,
				currency: "USD",
				formData,
				mode: "test",
			});

			expect(mockDonorfy.updateConstituentPreferences).toHaveBeenCalledWith(
				"CONST123",
				expect.objectContaining({
					PreferencesList: expect.arrayContaining([
						expect.objectContaining({
							PreferenceType: "Channel",
							PreferenceName: "Email",
							PreferenceAllowed: true,
						}),
						expect.objectContaining({
							PreferenceType: "Channel",
							PreferenceName: "Mail",
							PreferenceAllowed: true,
						}),
					]),
				}),
			);
		});
	});
});
