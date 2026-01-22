// Mock fetch globally
global.fetch = jest.fn();

describe("DonorfyClient", () => {
	let DonorfyClient;
	let client;
	const mockApiKey = "test-api-key-123";
	const mockTenant = "test-tenant";

	beforeEach(() => {
		jest.resetModules();
		DonorfyClient = require("@/app/lib/donorfy/donorfyClient").default;
		client = new DonorfyClient(mockApiKey, mockTenant);
		fetch.mockClear();
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe("constructor", () => {
		it("should initialize with correct properties", () => {
			expect(client.apiKey).toBe(mockApiKey);
			expect(client.tenant).toBe(mockTenant);
			expect(client.baseUrl).toBe(
				`https://data.donorfy.com/api/v1/${mockTenant}`,
			);
		});

		it("should create correct auth header", () => {
			const expectedAuth =
				"Basic " + Buffer.from(`DonationApp:${mockApiKey}`).toString("base64");
			expect(client.authHeader).toBe(expectedAuth);
		});
	});

	describe("request method", () => {
		it("should make GET request with correct headers", async () => {
			const mockResponse = { id: "123", name: "Test" };
			fetch.mockResolvedValueOnce({
				ok: true,
				json: async () => mockResponse,
			});

			const result = await client.request("constituents/123");

			expect(fetch).toHaveBeenCalledWith(
				`https://data.donorfy.com/api/v1/${mockTenant}/constituents/123`,
				{
					method: "GET",
					headers: {
						Authorization: client.authHeader,
						"Content-Type": "application/json",
					},
				},
			);
			expect(result).toEqual(mockResponse);
		});

		it("should make POST request with body", async () => {
			const mockBody = { firstName: "John", lastName: "Doe" };
			const mockResponse = { id: "456" };
			fetch.mockResolvedValueOnce({
				ok: true,
				json: async () => mockResponse,
			});

			const result = await client.request("constituents", "POST", mockBody);

			expect(fetch).toHaveBeenCalledWith(
				`https://data.donorfy.com/api/v1/${mockTenant}/constituents`,
				{
					method: "POST",
					headers: {
						Authorization: client.authHeader,
						"Content-Type": "application/json",
					},
					body: JSON.stringify(mockBody),
				},
			);
			expect(result).toEqual(mockResponse);
		});

		it("should throw error when response is not ok", async () => {
			fetch.mockResolvedValueOnce({
				ok: false,
				status: 404,
				statusText: "Not Found",
				json: async () => ({ error: "Constituent not found" }),
			});

			await expect(client.request("constituents/999")).rejects.toThrow(
				'Donorfy API error: 404 Not Found {"error":"Constituent not found"}',
			);
		});

		it("should handle non-JSON responses", async () => {
			fetch.mockResolvedValueOnce({
				ok: false,
				status: 500,
				statusText: "Internal Server Error",
				json: async () => {
					throw new Error("Invalid JSON");
				},
			});

			await expect(client.request("constituents/123")).rejects.toThrow(
				"Donorfy API error: 500 Internal Server Error",
			);
		});
	});

	describe("constituent methods", () => {
		it("should create constituent", async () => {
			const mockData = { firstName: "Jane", lastName: "Smith" };
			const mockResponse = { id: "789" };
			fetch.mockResolvedValueOnce({
				ok: true,
				json: async () => mockResponse,
			});

			const result = await client.createConstituent(mockData);

			expect(fetch).toHaveBeenCalledWith(
				expect.stringContaining("/constituents"),
				expect.objectContaining({
					method: "POST",
					body: JSON.stringify(mockData),
				}),
			);
			expect(result).toEqual(mockResponse);
		});

		it("should get constituent", async () => {
			const mockResponse = { id: "123", firstName: "John" };
			fetch.mockResolvedValueOnce({
				ok: true,
				json: async () => mockResponse,
			});

			const result = await client.getConstituent("123");

			expect(fetch).toHaveBeenCalledWith(
				expect.stringContaining("/constituents/123"),
				expect.objectContaining({ method: "GET" }),
			);
			expect(result).toEqual(mockResponse);
		});

		it("should update constituent", async () => {
			const mockData = { firstName: "Updated" };
			const mockResponse = { id: "123", firstName: "Updated" };
			fetch.mockResolvedValueOnce({
				ok: true,
				json: async () => mockResponse,
			});

			const result = await client.updateConstituent("123", mockData);

			expect(fetch).toHaveBeenCalledWith(
				expect.stringContaining("/constituents/123"),
				expect.objectContaining({
					method: "PUT",
					body: JSON.stringify(mockData),
				}),
			);
			expect(result).toEqual(mockResponse);
		});

		it("should delete constituent", async () => {
			fetch.mockResolvedValueOnce({
				ok: true,
				json: async () => ({}),
			});

			await client.deleteConstituent("123");

			expect(fetch).toHaveBeenCalledWith(
				expect.stringContaining("/constituents/123"),
				expect.objectContaining({ method: "DELETE" }),
			);
		});

		it("should check for duplicates", async () => {
			const mockData = {
				firstName: "John",
				lastName: "Doe",
				email: "john@example.com",
			};
			const mockResponse = { duplicates: [] };
			fetch.mockResolvedValueOnce({
				ok: true,
				json: async () => mockResponse,
			});

			const result = await client.duplicateCheck(mockData);

			expect(fetch).toHaveBeenCalledWith(
				expect.stringContaining("/constituents/DuplicateCheckPerson"),
				expect.objectContaining({
					method: "POST",
					body: JSON.stringify(mockData),
				}),
			);
			expect(result).toEqual(mockResponse);
		});
	});

	describe("constituent preferences", () => {
		it("should get constituent preferences", async () => {
			const mockResponse = { email: true };
			fetch.mockResolvedValueOnce({
				ok: true,
				json: async () => mockResponse,
			});

			const result = await client.getConstituentPreferences("123");

			expect(fetch).toHaveBeenCalledWith(
				expect.stringContaining("/constituents/123/Preferences"),
				expect.objectContaining({ method: "GET" }),
			);
			expect(result).toEqual(mockResponse);
		});

		it("should update constituent preferences", async () => {
			const mockData = { emailUpdates: false };
			fetch.mockResolvedValueOnce({
				ok: true,
				json: async () => mockData,
			});

			await client.updateConstituentPreferences("123", mockData);

			expect(fetch).toHaveBeenCalledWith(
				expect.stringContaining("/constituents/123/Preferences"),
				expect.objectContaining({
					method: "POST",
					body: JSON.stringify(mockData),
				}),
			);
		});
	});

	describe("tag methods", () => {
		it("should add active tags", async () => {
			const mockTags = ["Donor", "Newsletter"];
			fetch.mockResolvedValueOnce({
				ok: true,
				json: async () => ({}),
			});

			await client.addActiveTags("123", mockTags);

			expect(fetch).toHaveBeenCalledWith(
				expect.stringContaining("/constituents/123/AddActiveTags"),
				expect.objectContaining({
					method: "POST",
					body: JSON.stringify(mockTags),
				}),
			);
		});

		it("should remove tag", async () => {
			const mockTags = ["OldTag"];
			fetch.mockResolvedValueOnce({
				ok: true,
				json: async () => ({}),
			});

			await client.removeTag("123", mockTags);

			expect(fetch).toHaveBeenCalledWith(
				expect.stringContaining("/constituents/123/RemoveTag"),
				expect.objectContaining({
					method: "DELETE",
					body: JSON.stringify(mockTags),
				}),
			);
		});

		it("should get constituent tags", async () => {
			const mockResponse = ["Donor", "Volunteer"];
			fetch.mockResolvedValueOnce({
				ok: true,
				json: async () => mockResponse,
			});

			const result = await client.getConstituentTags("123");

			expect(fetch).toHaveBeenCalledWith(
				expect.stringContaining("/constituents/123/ActiveTags"),
				expect.objectContaining({ method: "GET" }),
			);
			expect(result).toEqual(mockResponse);
		});
	});

	describe("gift aid methods", () => {
		it("should get gift aid declarations", async () => {
			const mockResponse = [{ id: "decl_123" }];
			fetch.mockResolvedValueOnce({
				ok: true,
				json: async () => mockResponse,
			});

			const result = await client.getConstituentGiftAidDeclarations("123");

			expect(fetch).toHaveBeenCalledWith(
				expect.stringContaining("/constituents/123/GiftAidDeclarations"),
				expect.objectContaining({ method: "GET" }),
			);
			expect(result).toEqual(mockResponse);
		});

		it("should create gift aid declaration with correct dates", async () => {
			const mockData = { Status: "Active" };
			const mockResponse = { id: "decl_456" };
			fetch.mockResolvedValueOnce({
				ok: true,
				json: async () => mockResponse,
			});

			const result = await client.createGiftAidDeclaration("123", mockData);

			expect(fetch).toHaveBeenCalledWith(
				expect.stringContaining("/constituents/123/GiftAidDeclarations"),
				expect.objectContaining({ method: "POST" }),
			);

			const bodyArg = JSON.parse(fetch.mock.calls[0][1].body);
			expect(bodyArg).toEqual(
				expect.objectContaining({
					Status: "Active",
					DeclarationMethod: "Web",
				}),
			);
			expect(bodyArg.DeclarationDate).toBeDefined();
			expect(bodyArg.DeclarationStartDate).toBeDefined();
			expect(bodyArg.DeclarationEndDate).toBeDefined();

			// Verify end date is ~100 years in the future
			const endDate = new Date(bodyArg.DeclarationEndDate);
			const startDate = new Date(bodyArg.DeclarationStartDate);
			const yearsDiff = (endDate - startDate) / (1000 * 60 * 60 * 24 * 365);
			expect(yearsDiff).toBeGreaterThan(99);
			expect(yearsDiff).toBeLessThan(101);

			expect(result).toEqual(mockResponse);
		});
	});

	describe("activity methods", () => {
		it("should add activity", async () => {
			const mockData = {
				ConstituentId: "123",
				ActivityType: "Donation",
			};
			const mockResponse = { id: "act_789" };
			fetch.mockResolvedValueOnce({
				ok: true,
				json: async () => mockResponse,
			});

			const result = await client.addActivity(mockData);

			expect(fetch).toHaveBeenCalledWith(
				expect.stringContaining("/activities"),
				expect.objectContaining({
					method: "POST",
					body: JSON.stringify(mockData),
				}),
			);
			expect(result).toEqual(mockResponse);
		});

		it("should get constituent activities", async () => {
			const mockResponse = [{ id: "act_1" }, { id: "act_2" }];
			fetch.mockResolvedValueOnce({
				ok: true,
				json: async () => mockResponse,
			});

			const result = await client.getConstituentActivities("123");

			expect(fetch).toHaveBeenCalledWith(
				expect.stringContaining("/constituents/123/Activities"),
				expect.objectContaining({ method: "GET" }),
			);
			expect(result).toEqual(mockResponse);
		});
	});

	describe("transaction methods", () => {
		it("should create transaction with all parameters", async () => {
			const mockResponse = { id: "txn_123" };
			fetch.mockResolvedValueOnce({
				ok: true,
				json: async () => mockResponse,
			});

			const result = await client.createTransaction(
				100,
				"Annual Campaign",
				"Card",
				"const_123",
				"2026-01-15T10:00:00Z",
				"General Fund",
				"website",
				"organic",
				"spring2026",
			);

			expect(fetch).toHaveBeenCalledWith(
				expect.stringContaining("/transactions"),
				expect.objectContaining({ method: "POST" }),
			);

			const bodyArg = JSON.parse(fetch.mock.calls[0][1].body);
			expect(bodyArg).toEqual({
				Product: "Donation",
				Amount: 100,
				Campaign: "Annual Campaign",
				PaymentMethod: "Card",
				Fund: "General Fund",
				ExistingConstituentId: "const_123",
				DatePaid: "2026-01-15T10:00:00Z",
				UtmSource: "website",
				UtmMedium: "organic",
				UtmCampaign: "spring2026",
				Comments:
					"utm_source=website, utm_medium=organic, utm_campaign=spring2026",
			});
			expect(result).toEqual(mockResponse);
		});

		it("should create transaction with defaults", async () => {
			const mockResponse = { id: "txn_456" };
			fetch.mockResolvedValueOnce({
				ok: true,
				json: async () => mockResponse,
			});

			await client.createTransaction(
				50,
				"Test Campaign",
				"PayPal",
				"const_456",
			);

			const bodyArg = JSON.parse(fetch.mock.calls[0][1].body);
			expect(bodyArg).toEqual(
				expect.objectContaining({
					Amount: 50,
					Campaign: "Test Campaign",
					PaymentMethod: "PayPal",
					Fund: "unrestricted",
					UtmSource: "unknown",
					UtmMedium: "unknown",
					UtmCampaign: "unknown",
				}),
			);
			expect(bodyArg.DatePaid).toBeDefined();
		});

		it("should get transaction", async () => {
			const mockResponse = { id: "txn_123", amount: 100 };
			fetch.mockResolvedValueOnce({
				ok: true,
				json: async () => mockResponse,
			});

			const result = await client.getTransaction("txn_123");

			expect(fetch).toHaveBeenCalledWith(
				expect.stringContaining("/transactions/txn_123"),
				expect.objectContaining({ method: "GET" }),
			);
			expect(result).toEqual(mockResponse);
		});

		it("should delete transaction", async () => {
			fetch.mockResolvedValueOnce({
				ok: true,
				json: async () => ({}),
			});

			await client.deleteTransaction("txn_123");

			expect(fetch).toHaveBeenCalledWith(
				expect.stringContaining("/transactions/txn_123"),
				expect.objectContaining({ method: "DELETE" }),
			);
		});
	});
});
