// Mock all dependencies
jest.mock("@/app/lib/mailchimp/addTag");
jest.mock("@/app/lib/sparkpost/sendEmailByTemplateName");
jest.mock("@/app/lib/utils/apiUtils");

describe("Freedom Foundation Campaign", () => {
	let mockDonorfy;
	let originalEnv;
	let freedomFoundation;
	let addTag;
	let sendEmailByTemplateName;
	let getDonorfyClient;

	beforeEach(() => {
		jest.clearAllMocks();
		jest.resetModules();
		originalEnv = process.env.VERCEL_ENV;

		// Mock Donorfy client
		mockDonorfy = {
			getConstituent: jest.fn(),
			addActiveTags: jest.fn(),
			addActivity: jest.fn(),
		};

		// Require mocked modules
		addTag = require("@/app/lib/mailchimp/addTag").default; // ES6 default export
		sendEmailByTemplateName = require("@/app/lib/sparkpost/sendEmailByTemplateName"); // CommonJS export
		const apiUtils = require("@/app/lib/utils/apiUtils");
		getDonorfyClient = apiUtils.getDonorfyClient;

		getDonorfyClient.mockReturnValue(mockDonorfy);
		sendEmailByTemplateName.mockResolvedValue(true);
		addTag.mockResolvedValue(true);

		// Require the function after mocks are set up
		freedomFoundation =
			require("@/app/lib/campaigns/freedomFoundation").default;
	});

	afterEach(() => {
		process.env.VERCEL_ENV = originalEnv;
	});

	const mockFormData = {
		emailPreference: "true",
		projectId: "PP1028 Deborah",
		givingTo: "Deborah's Project",
		donorType: "individual",
		organisationName: null,
	};

	const mockMetadata = {
		firstName: "John",
		email: "john@example.com",
		projectId: "PP1028 Deborah",
	};

	const mockConstituent = {
		FirstName: "John",
		EmailAddress: "john@example.com",
	};

	describe("successful campaign processing", () => {
		beforeEach(() => {
			mockDonorfy.getConstituent.mockResolvedValue(mockConstituent);
			mockDonorfy.addActiveTags.mockResolvedValue(true);
			mockDonorfy.addActivity.mockResolvedValue({ id: "12345" });
		});

		it("should process USD individual donation successfully", async () => {
			await freedomFoundation(mockFormData, mockMetadata, "123456", "usd", 100);

			// Verify Donorfy calls
			expect(getDonorfyClient).toHaveBeenCalledWith("us");
			expect(mockDonorfy.getConstituent).toHaveBeenCalledWith("123456");
			expect(mockDonorfy.addActiveTags).toHaveBeenCalledWith(
				"123456",
				"FreedomFoundation_PP1028 Deborah",
			);

			// Verify admin email
			expect(sendEmailByTemplateName).toHaveBeenCalledWith(
				"freedom-foundation-admin-notification",
				expect.any(String),
				{
					constituentNumber: "123456",
					fund: "PP1028 Deborah",
					amount: "$100",
					donorfy: "US",
				},
			);

			// Verify thank you email
			expect(sendEmailByTemplateName).toHaveBeenCalledWith(
				"freedom-foundation-thank-you-PP1028-Deborah",
				"john@example.com",
				{
					name: "John",
					amount: "$100",
					givingTo: "Deborah's Project",
				},
			);

			// Verify activity creation
			expect(mockDonorfy.addActivity).toHaveBeenCalledWith({
				ExistingConstituentId: "123456",
				ActivityType: "FreedomFoundation Donation",
				Campaign: "FreedomFoundation",
				Notes: expect.stringContaining("Freedom Foundation Donation created"),
			});
		});

		it("should process GBP organization donation successfully", async () => {
			const orgFormData = {
				...mockFormData,
				donorType: "organisation",
				organisationName: "Test Org Ltd",
			};

			await freedomFoundation(orgFormData, mockMetadata, "123456", "gbp", 50);

			// Verify UK Donorfy client used
			expect(getDonorfyClient).toHaveBeenCalledWith("uk");

			// Verify organization tags
			expect(mockDonorfy.addActiveTags).toHaveBeenCalledWith(
				"123456",
				"FreedomFoundation_PP1028 Deborah,FreedomFoundation_Type Organisation",
			);

			// Verify GBP currency in emails
			expect(sendEmailByTemplateName).toHaveBeenCalledWith(
				"freedom-foundation-admin-notification",
				expect.any(String),
				expect.objectContaining({
					amount: "£50",
					donorfy: "UK",
				}),
			);

			expect(sendEmailByTemplateName).toHaveBeenCalledWith(
				"freedom-foundation-thank-you-PP1028-Deborah",
				"john@example.com",
				expect.objectContaining({
					amount: "£50",
				}),
			);
		});

		it("should handle different project templates correctly", async () => {
			const testCases = [
				{
					projectId: "PP1006 Advocacy",
					template: "freedom-foundation-thank-you-PP1006-Advocacy",
				},
				{
					projectId: "PP1010 Midwest",
					template: "freedom-foundation-thank-you-PP1010-Midwest",
				},
				{
					projectId: "PP1009 Tennessee",
					template: "freedom-foundation-thank-you-PP1009-Tennessee",
				},
				{
					projectId: "FF25 USA Policy",
					template: "freedom-foundation-thank-you-FF25-USA-Policy",
				},
				{
					projectId: "PP1018 Uganda",
					template: "freedom-foundation-thank-you-PP1018-Uganda",
				},
			];

			for (const testCase of testCases) {
				jest.clearAllMocks();
				mockDonorfy.getConstituent.mockResolvedValue(mockConstituent);
				mockDonorfy.addActiveTags.mockResolvedValue(true);
				mockDonorfy.addActivity.mockResolvedValue({ id: "12345" });

				const metadata = { ...mockMetadata, projectId: testCase.projectId };

				await freedomFoundation(mockFormData, metadata, "123456", "usd", 100);

				// Check that the thank you email was sent (second call to sendEmailByTemplateName)
				const calls = sendEmailByTemplateName.mock.calls;
				const thankYouCall = calls.find((call) =>
					call[0].startsWith("freedom-foundation-thank-you"),
				);
				expect(thankYouCall).toBeDefined();
				expect(thankYouCall[0]).toBe(testCase.template);
				expect(thankYouCall[1]).toBe("john@example.com");
			}
		});
	});

	describe("Mailchimp integration", () => {
		beforeEach(() => {
			mockDonorfy.getConstituent.mockResolvedValue(mockConstituent);
			mockDonorfy.addActiveTags.mockResolvedValue(true);
			mockDonorfy.addActivity.mockResolvedValue({ id: "12345" });
		});

		it("should add Mailchimp tags for individual donors with email preference", async () => {
			// Clear modules and set environment before requiring
			jest.resetModules();
			process.env.VERCEL_ENV = "production"; // Not test mode

			// Re-setup mocks after resetModules
			const mockSend = jest.fn().mockResolvedValue(true);
			addTag = require("@/app/lib/mailchimp/addTag").default;
			sendEmailByTemplateName = require("@/app/lib/sparkpost/sendEmailByTemplateName");
			const apiUtils = require("@/app/lib/utils/apiUtils");
			getDonorfyClient = apiUtils.getDonorfyClient;

			getDonorfyClient.mockReturnValue(mockDonorfy);
			sendEmailByTemplateName.mockResolvedValue(true);
			addTag.mockResolvedValue(true);

			// Now require the function with production environment
			freedomFoundation =
				require("@/app/lib/campaigns/freedomFoundation").default;

			await freedomFoundation(mockFormData, mockMetadata, "123456", "usd", 100);

			// Should add both tags for individual donors
			expect(addTag).toHaveBeenCalledWith(
				"john@example.com",
				"Dont send welcome email",
				"us",
			);

			expect(addTag).toHaveBeenCalledWith(
				"john@example.com",
				"FreedomFoundation Fund PP1028 Deborah",
				"us",
			);

			expect(addTag).toHaveBeenCalledTimes(2);
		});

		it("should add additional organization tag for organization donors", async () => {
			// Clear modules and set environment before requiring
			jest.resetModules();
			process.env.VERCEL_ENV = "production"; // Not test mode

			// Re-setup mocks after resetModules
			addTag = require("@/app/lib/mailchimp/addTag").default;
			sendEmailByTemplateName = require("@/app/lib/sparkpost/sendEmailByTemplateName");
			const apiUtils = require("@/app/lib/utils/apiUtils");
			getDonorfyClient = apiUtils.getDonorfyClient;

			getDonorfyClient.mockReturnValue(mockDonorfy);
			sendEmailByTemplateName.mockResolvedValue(true);
			addTag.mockResolvedValue(true);

			// Now require the function with production environment
			freedomFoundation =
				require("@/app/lib/campaigns/freedomFoundation").default;

			const orgFormData = {
				...mockFormData,
				donorType: "organisation",
			};

			await freedomFoundation(orgFormData, mockMetadata, "123456", "gbp", 50);

			// Should add organization type tag plus the other two
			expect(addTag).toHaveBeenCalledWith(
				"john@example.com",
				"FreedomFoundation Type Organisation",
				"uk",
			);

			expect(addTag).toHaveBeenCalledWith(
				"john@example.com",
				"Dont send welcome email",
				"uk",
			);

			expect(addTag).toHaveBeenCalledWith(
				"john@example.com",
				"FreedomFoundation Fund PP1028 Deborah",
				"uk",
			);

			expect(addTag).toHaveBeenCalledTimes(3);
		});

		it("should not add Mailchimp tags when emailPreference is false", async () => {
			const noEmailFormData = {
				...mockFormData,
				emailPreference: "false",
			};

			await freedomFoundation(
				noEmailFormData,
				mockMetadata,
				"123456",
				"usd",
				100,
			);

			expect(addTag).not.toHaveBeenCalled();
		});

		it("should not add Mailchimp tags in test mode", async () => {
			process.env.VERCEL_ENV = "development";

			await freedomFoundation(mockFormData, mockMetadata, "123456", "usd", 100);

			expect(addTag).not.toHaveBeenCalled();
		});
	});

	describe("admin email recipients", () => {
		beforeEach(() => {
			mockDonorfy.getConstituent.mockResolvedValue(mockConstituent);
			mockDonorfy.addActiveTags.mockResolvedValue(true);
			mockDonorfy.addActivity.mockResolvedValue({ id: "12345" });
		});

		it("should send admin email to test address in non-production", async () => {
			process.env.VERCEL_ENV = "development";

			await freedomFoundation(mockFormData, mockMetadata, "123456", "usd", 100);

			expect(sendEmailByTemplateName).toHaveBeenCalledWith(
				"freedom-foundation-admin-notification",
				"james.holt@hopeforjustice.org",
				expect.any(Object),
			);
		});

		it("should send admin email to UK support in production for GBP", async () => {
			// Clear modules and set environment before requiring
			jest.resetModules();
			process.env.VERCEL_ENV = "production";

			// Re-setup mocks
			addTag = require("@/app/lib/mailchimp/addTag").default;
			sendEmailByTemplateName = require("@/app/lib/sparkpost/sendEmailByTemplateName");
			const apiUtils = require("@/app/lib/utils/apiUtils");
			getDonorfyClient = apiUtils.getDonorfyClient;

			getDonorfyClient.mockReturnValue(mockDonorfy);
			sendEmailByTemplateName.mockResolvedValue(true);
			addTag.mockResolvedValue(true);

			freedomFoundation =
				require("@/app/lib/campaigns/freedomFoundation").default;

			await freedomFoundation(mockFormData, mockMetadata, "123456", "gbp", 100);

			expect(sendEmailByTemplateName).toHaveBeenCalledWith(
				"freedom-foundation-admin-notification",
				"supporters@hopeforjustice.org",
				expect.any(Object),
			);
		});

		it("should send admin email to US support in production for USD", async () => {
			// Clear modules and set environment before requiring
			jest.resetModules();
			process.env.VERCEL_ENV = "production";

			// Re-setup mocks
			addTag = require("@/app/lib/mailchimp/addTag").default;
			sendEmailByTemplateName = require("@/app/lib/sparkpost/sendEmailByTemplateName");
			const apiUtils = require("@/app/lib/utils/apiUtils");
			getDonorfyClient = apiUtils.getDonorfyClient;

			getDonorfyClient.mockReturnValue(mockDonorfy);
			sendEmailByTemplateName.mockResolvedValue(true);
			addTag.mockResolvedValue(true);

			freedomFoundation =
				require("@/app/lib/campaigns/freedomFoundation").default;

			await freedomFoundation(mockFormData, mockMetadata, "123456", "usd", 100);

			expect(sendEmailByTemplateName).toHaveBeenCalledWith(
				"freedom-foundation-admin-notification",
				"donorsupport.us@hopeforjustice.org",
				expect.any(Object),
			);
		});
	});

	describe("error handling", () => {
		it("should throw error when Donorfy operations fail", async () => {
			mockDonorfy.getConstituent.mockRejectedValue(
				new Error("Donorfy API error"),
			);

			await expect(
				freedomFoundation(mockFormData, mockMetadata, "123456", "usd", 100),
			).rejects.toThrow("Failed to process Freedom Foundation campaign");
		});

		it("should throw error when email sending fails", async () => {
			mockDonorfy.getConstituent.mockResolvedValue(mockConstituent);
			mockDonorfy.addActiveTags.mockResolvedValue(true);
			sendEmailByTemplateName.mockRejectedValue(new Error("Email send failed"));

			await expect(
				freedomFoundation(mockFormData, mockMetadata, "123456", "usd", 100),
			).rejects.toThrow("Failed to process Freedom Foundation campaign");
		});

		it("should throw error when Mailchimp operations fail", async () => {
			// Clear modules and set environment before requiring
			jest.resetModules();
			process.env.VERCEL_ENV = "production";

			// Re-setup mocks
			addTag = require("@/app/lib/mailchimp/addTag").default;
			sendEmailByTemplateName = require("@/app/lib/sparkpost/sendEmailByTemplateName");
			const apiUtils = require("@/app/lib/utils/apiUtils");
			getDonorfyClient = apiUtils.getDonorfyClient;

			getDonorfyClient.mockReturnValue(mockDonorfy);
			sendEmailByTemplateName.mockResolvedValue(true);
			addTag.mockRejectedValue(new Error("Mailchimp API error"));

			freedomFoundation =
				require("@/app/lib/campaigns/freedomFoundation").default;

			mockDonorfy.getConstituent.mockResolvedValue(mockConstituent);
			mockDonorfy.addActiveTags.mockResolvedValue(true);
			mockDonorfy.addActivity.mockResolvedValue({ id: "12345" });

			await expect(
				freedomFoundation(mockFormData, mockMetadata, "123456", "usd", 100),
			).rejects.toThrow("Failed to process Freedom Foundation campaign");
		});
	});
});
