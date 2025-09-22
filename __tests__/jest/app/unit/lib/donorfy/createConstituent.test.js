import DonorfyClient from "@/app/lib/donorfy/donorfyClient";

// Mock the DonorfyClient
jest.mock("@/app/lib/donorfy/donorfyClient");

describe("DonorfyClient - createConstituent (unit)", () => {
	const testData = {
		ConstituentType: "individual",
		Title: "Mr",
		FirstName: "Harry",
		LastName: "Potter",
		AddressLine1: "4 Privet Drive",
		AddressLine2: "Little Whinging",
		Town: "Surrey",
		County: "England",
		Country: "United Kingdom",
		PostalCode: "12345",
		EmailAddress: "harry.potter@hogwarts.com",
		Phone1: "12345678910",
		RecruitmentCampaign: "TESTCAMPAIGN",
	};

	let mockDonorfyClient;

	beforeEach(() => {
		// Reset mocks before each test
		jest.clearAllMocks();

		// Create a mock instance with all the methods we need
		mockDonorfyClient = {
			createConstituent: jest.fn(),
			getConstituent: jest.fn(),
			updateConstituent: jest.fn(),
			deleteConstituent: jest.fn(),
		};

		// Mock the constructor to return our mock instance
		DonorfyClient.mockImplementation(() => mockDonorfyClient);
	});

	it("creates a constituent with correct data", async () => {
		const mockResponse = {
			result: "created",
			ConstituentId: "test-123",
		};

		mockDonorfyClient.createConstituent.mockResolvedValue(mockResponse);

		const client = new DonorfyClient("test-key", "test-tenant");
		const result = await client.createConstituent(testData);

		expect(mockDonorfyClient.createConstituent).toHaveBeenCalledWith(testData);
		expect(result).toEqual(mockResponse);
	});

	it("handles errors when creating constituent", async () => {
		const mockError = new Error("API error");
		mockDonorfyClient.createConstituent.mockRejectedValue(mockError);

		const client = new DonorfyClient("test-key", "test-tenant");

		await expect(client.createConstituent(testData)).rejects.toThrow(
			"API error"
		);
		expect(mockDonorfyClient.createConstituent).toHaveBeenCalledWith(testData);
	});
});
