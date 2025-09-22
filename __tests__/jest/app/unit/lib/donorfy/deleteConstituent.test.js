import DonorfyClient from "@/app/lib/donorfy/donorfyClient";

// Mock the DonorfyClient
jest.mock("@/app/lib/donorfy/donorfyClient");

describe("DonorfyClient - deleteConstituent (unit)", () => {
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

	it("deletes a constituent successfully", async () => {
		const mockResponse = { result: "deleted" };
		mockDonorfyClient.deleteConstituent.mockResolvedValue(mockResponse);

		const client = new DonorfyClient("test-key", "test-tenant");
		const result = await client.deleteConstituent("constituent-123");

		expect(mockDonorfyClient.deleteConstituent).toHaveBeenCalledWith(
			"constituent-123"
		);
		expect(result).toEqual(mockResponse);
	});

	it("handles errors when deleting constituent", async () => {
		const mockError = new Error("API error");
		mockDonorfyClient.deleteConstituent.mockRejectedValue(mockError);

		const client = new DonorfyClient("test-key", "test-tenant");

		await expect(client.deleteConstituent("constituent-123")).rejects.toThrow(
			"API error"
		);
		expect(mockDonorfyClient.deleteConstituent).toHaveBeenCalledWith(
			"constituent-123"
		);
	});
});
