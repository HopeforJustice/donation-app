// /**
//  * @jest-environment node
//  */
// import { handleCheckoutSessionCompleted } from "@/app/lib/webhookHandlers/stripe/handlers/checkoutSessionCompleted";
// import checkoutSessionFixture from "@tests/fixtures/stripe/gbp-checkout-session-completed.json";
// import { jest } from "@jest/globals";
// import { TestConstituentTracker } from "../../helpers/donorfyCleanup.js";

// // Mock Stripe client - we only mock the Stripe API calls, not our business logic
// const mockStripeClient = {
// 	paymentIntents: {
// 		retrieve: jest.fn(),
// 	},
// 	paymentMethods: {
// 		retrieve: jest.fn(),
// 	},
// };

// describe("Integration Test: GBP Default One-Off Donation", () => {
// 	// Test constituent tracker for cleanup
// 	const constituentTracker = new TestConstituentTracker("uk");

// 	// Helper function to create fixture variations
// 	function createFixtureVariation(baseFixture, overrides) {
// 		return {
// 			...baseFixture,
// 			id: `evt_test_${Date.now()}`,
// 			data: {
// 				...baseFixture.data,
// 				object: {
// 					...baseFixture.data.object,
// 					id: `cs_test_${Date.now()}`,
// 					customer_details: {
// 						...baseFixture.data.object.customer_details,
// 						email: `test.${Date.now()}@example.com`,
// 					},
// 					metadata: {
// 						...baseFixture.data.object.metadata,
// 						email: `test.${Date.now()}@example.com`,
// 						...overrides,
// 					},
// 				},
// 			},
// 		};
// 	}

// 	// Helper function to process webhook and assert common expectations
// 	async function processWebhookAndAssert(fixture, expectedCampaign) {
// 		// Update the mock to return metadata that matches this fixture variation
// 		mockStripeClient.paymentIntents.retrieve.mockResolvedValueOnce({
// 			id: fixture.data.object.payment_intent || "pi_test",
// 			metadata: {
// 				...fixture.data.object.metadata, // Use the metadata from the fixture variation
// 			},
// 		});

// 		const result = await handleCheckoutSessionCompleted(
// 			fixture,
// 			mockStripeClient,
// 		);

// 		// Common assertions
// 		expect(result.eventStatus).toBe("processed");
// 		expect(result.status).toBe(200);
// 		expect(result.constituentId).toBeDefined();
// 		expect(result.donorfyTransactionId).toBeDefined();

// 		// Track constituent for cleanup
// 		constituentTracker.track(result.constituentId);

// 		// Assert all steps were successful
// 		const failedSteps = result.results.filter((r) => !r.success);
// 		expect(failedSteps).toHaveLength(0);

// 		// Campaign-specific assertion - verify the campaign was used correctly
// 		const transactionStep = result.results.find(
// 			(r) => r.step === "Create transaction in Donorfy",
// 		);
// 		expect(transactionStep).toBeDefined();
// 		expect(transactionStep.success).toBe(true);

// 		// You can also verify the campaign in the processing results
// 		// The exact assertion depends on how your processing logic stores campaign info
// 		console.log(
// 			`✅ Processed webhook with campaign: ${expectedCampaign} - Constituent: ${result.constituentId}, Transaction: ${result.donorfyTransactionId}`,
// 		);

// 		return result;
// 	}

// 	afterAll(async () => {
// 		// Cleanup all test constituents
// 		await constituentTracker.cleanup();
// 	});

// 	it("should process a basic one-off donation with default campaign", async () => {
// 		// Use the original fixture as-is for a basic donation test
// 		const result = await processWebhookAndAssert(
// 			checkoutSessionFixture,
// 			checkoutSessionFixture.data.object.metadata.campaign,
// 		);

// 		// Verify the donation was processed correctly
// 		const { getDonorfyClient } = await import("@/app/lib/utils");
// 		const donorfy = getDonorfyClient("uk");

// 		// Get the transaction details to verify basic donation fields
// 		const transaction = await donorfy.getTransaction(
// 			result.donorfyTransactionId,
// 		);

// 		console.log("Transaction created:", {
// 			campaign: transaction.Campaign,
// 			amount: transaction.Amount,
// 			paymentMethod: transaction.PaymentMethod,
// 			fund: transaction.FundList,
// 		});

// 		// Basic assertions for a successful donation
// 		expect(transaction.Campaign).toBe(
// 			checkoutSessionFixture.data.object.metadata.campaign,
// 		);
// 		expect(transaction.Amount).toBe(25); // £25 from the fixture
// 		expect(transaction.PaymentMethod).toBe("Stripe Checkout");
// 		expect(transaction.FundList).toBe("Unrestricted");
// 	});
// });
