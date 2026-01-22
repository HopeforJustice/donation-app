// Mock the campaign modules before importing
jest.mock("@/app/lib/campaigns/freedomFoundation");
jest.mock("@/app/lib/campaigns/2025eoy");

describe("processCampaign", () => {
	let processCampaign;
	let freedomFoundation;
	let EOY2025;
	let consoleLogSpy;

	beforeEach(() => {
		jest.resetModules();

		// Import mocks
		freedomFoundation =
			require("@/app/lib/campaigns/freedomFoundation").default;
		EOY2025 = require("@/app/lib/campaigns/2025eoy").default;

		// Import function under test
		processCampaign = require("@/app/lib/campaigns/processCampaign").default;

		// Setup mocks
		freedomFoundation.mockResolvedValue({
			success: true,
			message: "Freedom Foundation processed",
		});
		EOY2025.mockResolvedValue({
			success: true,
			message: "EOY 2025 processed",
		});

		// Spy on console.log
		consoleLogSpy = jest.spyOn(console, "log").mockImplementation();
	});

	afterEach(() => {
		jest.clearAllMocks();
		consoleLogSpy.mockRestore();
	});

	describe("FreedomFoundation campaign", () => {
		it("should call freedomFoundation with correct parameters", async () => {
			const formData = { donorType: "individual", projectId: "PP1028 Deborah" };
			const metadata = { firstName: "John", email: "john@example.com" };
			const constituentId = "123456";
			const currency = "usd";
			const amount = 100;

			const result = await processCampaign(
				"FreedomFoundation",
				formData,
				metadata,
				constituentId,
				currency,
				amount,
			);

			expect(freedomFoundation).toHaveBeenCalledWith(
				formData,
				metadata,
				constituentId,
				currency,
				amount,
			);
			expect(freedomFoundation).toHaveBeenCalledTimes(1);
			expect(result).toEqual({
				success: true,
				message: "Freedom Foundation processed",
			});
		});

		it("should return the result from freedomFoundation", async () => {
			const expectedResult = { success: true, data: "test" };
			freedomFoundation.mockResolvedValue(expectedResult);

			const result = await processCampaign(
				"FreedomFoundation",
				{},
				{},
				"123",
				"gbp",
				50,
			);

			expect(result).toBe(expectedResult);
		});

		it("should propagate errors from freedomFoundation", async () => {
			const error = new Error("Freedom Foundation error");
			freedomFoundation.mockRejectedValue(error);

			await expect(
				processCampaign("FreedomFoundation", {}, {}, "123", "usd", 100),
			).rejects.toThrow("Freedom Foundation error");
		});
	});

	describe("2025 EOY campaign", () => {
		it("should call EOY2025 with correct parameters", async () => {
			const metadata = { firstName: "Jane", email: "jane@example.com" };
			const currency = "gbp";
			const amount = 75;

			const result = await processCampaign(
				"2025 EOY",
				{},
				metadata,
				"456789",
				currency,
				amount,
			);

			expect(EOY2025).toHaveBeenCalledWith(metadata, currency, amount);
			expect(EOY2025).toHaveBeenCalledTimes(1);
			expect(result).toEqual({
				success: true,
				message: "EOY 2025 processed",
			});
		});

		it("should return the result from EOY2025", async () => {
			const expectedResult = { success: true, campaign: "EOY" };
			EOY2025.mockResolvedValue(expectedResult);

			const result = await processCampaign(
				"2025 EOY",
				{},
				{},
				"789",
				"usd",
				200,
			);

			expect(result).toBe(expectedResult);
		});

		it("should propagate errors from EOY2025", async () => {
			const error = new Error("EOY processing failed");
			EOY2025.mockRejectedValue(error);

			await expect(
				processCampaign("2025 EOY", {}, {}, "789", "usd", 200),
			).rejects.toThrow("EOY processing failed");
		});
	});

	describe("unknown campaigns", () => {
		it("should log message for unknown campaign", async () => {
			const result = await processCampaign(
				"UnknownCampaign",
				{},
				{},
				"123",
				"usd",
				100,
			);

			expect(consoleLogSpy).toHaveBeenCalledWith(
				"UnknownCampaign has no specific processing logic defined.",
			);
			expect(freedomFoundation).not.toHaveBeenCalled();
			expect(EOY2025).not.toHaveBeenCalled();
			expect(result).toBeUndefined();
		});

		it("should handle empty campaign name", async () => {
			const result = await processCampaign("", {}, {}, "123", "usd", 100);

			expect(consoleLogSpy).toHaveBeenCalledWith(
				" has no specific processing logic defined.",
			);
			expect(result).toBeUndefined();
		});

		it("should handle null campaign name", async () => {
			const result = await processCampaign(null, {}, {}, "123", "usd", 100);

			expect(consoleLogSpy).toHaveBeenCalledWith(
				"null has no specific processing logic defined.",
			);
			expect(result).toBeUndefined();
		});
	});

	describe("campaign case sensitivity", () => {
		it("should not match FreedomFoundation with different casing", async () => {
			await processCampaign("freedomfoundation", {}, {}, "123", "usd", 100);

			expect(freedomFoundation).not.toHaveBeenCalled();
			expect(consoleLogSpy).toHaveBeenCalledWith(
				"freedomfoundation has no specific processing logic defined.",
			);
		});

		it("should not match 2025 EOY with different casing", async () => {
			await processCampaign("2025 eoy", {}, {}, "123", "usd", 100);

			expect(EOY2025).not.toHaveBeenCalled();
			expect(consoleLogSpy).toHaveBeenCalledWith(
				"2025 eoy has no specific processing logic defined.",
			);
		});
	});
});
