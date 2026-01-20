import {
	billingRequest,
	validateAndTrimAdditionalDetails,
} from "@/app/lib/gocardless/billingRequest";
import { getGoCardlessClient } from "@/app/lib/gocardless/gocardlessclient";

const client = getGoCardlessClient();

describe("Integration: GoCardless Billing Request", () => {
	// Mock environment variables
	beforeAll(() => {
		process.env.GC_SUCCESS_URL = "https://example.com/success";
		process.env.GC_EXIT_URL = "https://example.com/exit";
	});

	describe("validateAndTrimAdditionalDetails", () => {
		it("should return details unchanged if under 500 characters", () => {
			const shortDetails = {
				currency: "GBP",
				title: "Mr",
				firstName: "John",
				lastName: "Doe",
				amount: "50.00",
				frequency: "monthly",
			};

			const result = validateAndTrimAdditionalDetails(shortDetails);
			expect(result).toEqual(shortDetails);
		});

		it("should remove UTM parameters first when over limit", () => {
			const longDetails = {
				currency: "GBP",
				title: "Mr",
				firstName: "John",
				lastName: "Doe",
				amount: "50.00",
				frequency: "monthly",
				campaign: "spring-campaign-2024",
				preferences: {
					sms: true,
					post: true,
					phone: true,
					email: true,
				},
				giftAid: true,
				inspirationQuestion: "What inspired you to give?",
				inspirationDetails:
					"I was inspired by the amazing work you do helping people in need. This is a very long text that might push us over the character limit when combined with all the other fields in the additional details object.",
				utmSource: "facebook-advertising-campaign-spring-2024",
				utmMedium: "social-media-advertising",
				utmCampaign: "spring-fundraising-campaign-2024-hope-for-justice",
				stateCounty: "Greater London",
				phone: "+44 7123 456789",
			};

			const result = validateAndTrimAdditionalDetails(longDetails);

			// UTM parameters should be removed
			expect(result.utmSource).toBeUndefined();
			expect(result.utmMedium).toBeUndefined();
			expect(result.utmCampaign).toBeUndefined();

			// Core fields should remain
			expect(result.currency).toBe("GBP");
			expect(result.firstName).toBe("John");
			expect(result.lastName).toBe("Doe");

			// Result should be under 500 characters
			expect(JSON.stringify(result).length).toBeLessThanOrEqual(500);
		});

		it("should progressively remove fields until under limit", () => {
			const veryLongDetails = {
				currency: "GBP",
				title: "Mr",
				firstName: "John",
				lastName: "Doe",
				amount: "50.00",
				frequency: "monthly",
				campaign: "spring-campaign-2024-very-long-campaign-name",
				preferences: {
					sms: true,
					post: true,
					phone: true,
					email: true,
				},
				giftAid: true,
				inspirationQuestion: "What inspired you to give to our charity today?",
				inspirationDetails:
					"I was deeply inspired by the incredible and amazing work that your organization does every single day to help people who are in desperate need of assistance and support. This is a very very long text that definitely will push us over the character limit.",
				utmSource: "facebook-advertising-campaign-spring-2024-hope-for-justice",
				utmMedium: "social-media-advertising-platform",
				utmCampaign:
					"spring-fundraising-campaign-2024-hope-for-justice-charity",
				stateCounty: "Greater London Metropolitan Area",
				phone: "+44 7123 456789",
			};

			const result = validateAndTrimAdditionalDetails(veryLongDetails);

			// Should remove multiple fields
			expect(result.utmSource).toBeUndefined();
			expect(result.utmMedium).toBeUndefined();
			expect(result.utmCampaign).toBeUndefined();
			expect(result.inspirationDetails).toBeUndefined();

			// Core fields should remain
			expect(result.currency).toBe("GBP");
			expect(result.firstName).toBe("John");
			expect(result.preferences).toBeDefined();

			// Result should be under 500 characters
			expect(JSON.stringify(result).length).toBeLessThanOrEqual(500);
		});

		it("should throw error if core data exceeds 500 characters", () => {
			const impossiblyLongDetails = {
				currency: "GBP",
				title: "Mr",
				firstName:
					"JohnWithAnExtremelyVeryLongFirstNameThatGoesOnAndOnAndOnAndOnAndOnAndOnAndOnAndOnAndOnAndOnAndOnAndOnAndOnAndOnAndOnAndOnAndOnAndOnAndOnAndOnAndOnAndOnAndOnAndOnAndOnAndOnAndOnAndOnAndOnAndOnAndOnAndOnAndOnAndOnAndOnAndOnAndOnAndOnAndOnAndOnAndOnAndOnAndOnAndOnAndOnAndOnAndOnAndOnAndOnAndOnAndOnAndOnAndOnAndOnAndOnAndOnAndOnAndOnAndOn",
				lastName:
					"DoeWithAnExtremelyVeryLongLastNameThatGoesOnAndOnAndOnAndOnAndOnAndOnAndOnAndOnAndOnAndOnAndOnAndOnAndOnAndOnAndOnAndOnAndOnAndOnAndOnAndOnAndOnAndOnAndOnAndOnAndOnAndOnAndOnAndOnAndOnAndOnAndOnAndOnAndOnAndOnAndOnAndOnAndOnAndOnAndOnAndOnAndOnAndOnAndOnAndOnAndOnAndOnAndOnAndOnAndOnAndOnAndOnAndOnAndOnAndOnAndOnAndOnAndOnAndOnAndOn",
				amount: "50.00",
				frequency: "monthly",
				campaign:
					"spring-campaign-2024-with-an-extremely-long-campaign-name-that-goes-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on-and-on",
				preferences: {
					sms: true,
					post: true,
					phone: true,
					email: true,
				},
				giftAid: true,
				directDebitDay:
					"1st of every month starting from next month with additional very long description that makes this field extremely long and pushes the character count way over the limit",
			};

			expect(() => {
				validateAndTrimAdditionalDetails(impossiblyLongDetails);
			}).toThrow(/Additional details still exceed 500 character limit/);
		});
	});

	describe("billingRequest integration", () => {
		let createdBillingRequest;

		afterEach(async () => {
			// Cleanup - note: GoCardless doesn't allow deletion of billing requests in sandbox
			// so we just track them for manual cleanup if needed
			if (createdBillingRequest) {
				console.log("Created billing request:", createdBillingRequest.id);
				createdBillingRequest = null;
			}
		});

		it("should create a billing request with normal data", async () => {
			const formData = {
				currency: "GBP",
				title: "Mr",
				firstName: "John",
				lastName: "Doe",
				email: "john.doe@example.com",
				phone: "+44 7123 456789",
				address1: "123 Test Street",
				address2: "Apt 4B",
				townCity: "London",
				postcode: "SW1A 1AA",
				campaign: "test-campaign",
				amount: "50.00",
				stateCounty: "Greater London",
				directDebitStartDate: "2024-03-01",
				givingFrequency: "monthly",
				smsPreference: true,
				postPreference: true,
				phonePreference: true,
				emailPreference: true,
				giftAid: true,
				inspirationQuestion: "What inspired you to give?",
				inspirationDetails: "Test inspiration details",
				utmSource: "test",
				utmMedium: "test",
				utmCampaign: "test",
			};

			const result = await billingRequest(formData);

			expect(result).toBeDefined();
			expect(result.authorisationUrl).toBeDefined();
			expect(typeof result.authorisationUrl).toBe("string");
			expect(result.authorisationUrl).toMatch(
				/https:\/\/pay-sandbox\.gocardless\.com/
			);

			// Track for cleanup
			createdBillingRequest = { id: "tracked-for-cleanup" };
		}, 30000); // 30 second timeout for API calls

		it("should create a billing request with long data that requires trimming", async () => {
			const formDataWithLongFields = {
				currency: "GBP",
				title: "Mr",
				firstName: "John",
				lastName: "Doe",
				email: "john.doe@example.com",
				phone: "+44 7123 456789",
				address1: "123 Test Street",
				address2: "Apt 4B",
				townCity: "London",
				postcode: "SW1A 1AA",
				campaign: "spring-campaign-2024",
				amount: "100.00",
				stateCounty: "Greater London Metropolitan Area",
				directDebitStartDate: "2024-03-01",
				givingFrequency: "monthly",
				smsPreference: true,
				postPreference: true,
				phonePreference: true,
				emailPreference: true,
				giftAid: true,
				inspirationQuestion: "What inspired you to give to our charity today?",
				inspirationDetails:
					"I was deeply inspired by the incredible work that your organization does every single day to help people who are in desperate need of assistance and support throughout the world.",
				utmSource: "facebook-advertising-campaign-spring-2024-hope-for-justice",
				utmMedium: "social-media-advertising-platform",
				utmCampaign:
					"spring-fundraising-campaign-2024-hope-for-justice-charity",
			};

			const result = await billingRequest(formDataWithLongFields);

			expect(result).toBeDefined();
			expect(result.authorisationUrl).toBeDefined();
			expect(typeof result.authorisationUrl).toBe("string");
			expect(result.authorisationUrl).toMatch(
				/https:\/\/pay-sandbox\.gocardless\.com/
			);

			// Track for cleanup
			createdBillingRequest = { id: "tracked-for-cleanup" };
		}, 30000);

		it("should handle missing optional fields gracefully", async () => {
			const minimalFormData = {
				currency: "GBP",
				title: "Ms",
				firstName: "Jane",
				lastName: "Smith",
				email: "jane.smith@example.com",
				address1: "456 Minimal Street",
				townCity: "Birmingham",
				postcode: "B1 1AA",
				campaign: "minimal-test",
				amount: "25.00",
				directDebitStartDate: "2024-04-01",
				givingFrequency: "once",
				smsPreference: false,
				postPreference: false,
				phonePreference: false,
				emailPreference: true,
				giftAid: false,
				// Missing: phone, address2, stateCounty, inspiration fields, utm fields
			};

			const result = await billingRequest(minimalFormData);

			expect(result).toBeDefined();
			expect(result.authorisationUrl).toBeDefined();
			expect(typeof result.authorisationUrl).toBe("string");

			// Track for cleanup
			createdBillingRequest = { id: "tracked-for-cleanup" };
		}, 30000);
	});
});
