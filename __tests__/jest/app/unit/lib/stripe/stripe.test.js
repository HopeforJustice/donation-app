// Mock Stripe dependencies
jest.mock("@stripe/stripe-js");
jest.mock("stripe");

describe("Stripe Functions", () => {
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

	describe("getStripePromise", () => {
		let getStripePromise;
		let loadStripe;

		beforeEach(() => {
			jest.resetModules();
			jest.unmock("@/app/lib/stripe/getStripePromise");

			// Setup environment variables
			process.env.NEXT_PUBLIC_STRIPE_UK_PUBLISHABLE_KEY_LIVE =
				"pk_live_uk_12345";
			process.env.NEXT_PUBLIC_STRIPE_UK_PUBLISHABLE_KEY_TEST =
				"pk_test_uk_12345";
			process.env.NEXT_PUBLIC_STRIPE_US_PUBLISHABLE_KEY_LIVE =
				"pk_live_us_12345";
			process.env.NEXT_PUBLIC_STRIPE_US_PUBLISHABLE_KEY_TEST =
				"pk_test_us_12345";

			loadStripe = require("@stripe/stripe-js").loadStripe;
			loadStripe.mockResolvedValue({ id: "stripe_instance" });

			const {
				getStripePromise: importedFunction,
			} = require("@/app/lib/stripe/getStripePromise");
			getStripePromise = importedFunction;
		});

		afterEach(() => {
			delete process.env.NEXT_PUBLIC_STRIPE_UK_PUBLISHABLE_KEY_LIVE;
			delete process.env.NEXT_PUBLIC_STRIPE_UK_PUBLISHABLE_KEY_TEST;
			delete process.env.NEXT_PUBLIC_STRIPE_US_PUBLISHABLE_KEY_LIVE;
			delete process.env.NEXT_PUBLIC_STRIPE_US_PUBLISHABLE_KEY_TEST;
		});

		it("should load Stripe with UK test key for GBP currency", async () => {
			await getStripePromise({ currency: "gbp", mode: "test" });

			expect(loadStripe).toHaveBeenCalledWith("pk_test_uk_12345");
		});

		it("should load Stripe with UK live key for GBP currency in live mode", async () => {
			await getStripePromise({ currency: "gbp", mode: "live" });

			expect(loadStripe).toHaveBeenCalledWith("pk_live_uk_12345");
		});

		it("should load Stripe with UK test key for NOK currency", async () => {
			await getStripePromise({ currency: "nok", mode: "test" });

			expect(loadStripe).toHaveBeenCalledWith("pk_test_uk_12345");
		});

		it("should load Stripe with UK live key for NOK currency in live mode", async () => {
			await getStripePromise({ currency: "nok", mode: "live" });

			expect(loadStripe).toHaveBeenCalledWith("pk_live_uk_12345");
		});

		it("should load Stripe with US test key for USD currency", async () => {
			await getStripePromise({ currency: "usd", mode: "test" });

			expect(loadStripe).toHaveBeenCalledWith("pk_test_us_12345");
		});

		it("should load Stripe with US live key for USD currency in live mode", async () => {
			await getStripePromise({ currency: "usd", mode: "live" });

			expect(loadStripe).toHaveBeenCalledWith("pk_live_us_12345");
		});

		it("should default to live mode when mode not specified", async () => {
			await getStripePromise({ currency: "gbp" });

			expect(loadStripe).toHaveBeenCalledWith("pk_live_uk_12345");
		});

		it("should throw error when key is missing for currency", () => {
			delete process.env.NEXT_PUBLIC_STRIPE_UK_PUBLISHABLE_KEY_TEST;

			expect(() => getStripePromise({ currency: "gbp", mode: "test" })).toThrow(
				"Missing Stripe publishable key for currency/mode.",
			);
		});

		it("should throw error for unsupported currency", () => {
			expect(() => getStripePromise({ currency: "eur", mode: "test" })).toThrow(
				"Missing Stripe publishable key for currency/mode.",
			);
		});

		it("should return the loadStripe promise", async () => {
			const result = await getStripePromise({ currency: "usd", mode: "test" });

			expect(result).toEqual({ id: "stripe_instance" });
		});

		it("should handle case-sensitive currency codes", () => {
			// Currency codes are case-sensitive, GBP should throw error
			expect(() => getStripePromise({ currency: "GBP", mode: "test" })).toThrow(
				"Missing Stripe publishable key for currency/mode.",
			);
		});
	});

	describe("getStripeInstance", () => {
		let getStripeInstance;
		let Stripe;

		beforeEach(() => {
			jest.resetModules();
			jest.unmock("@/app/lib/stripe/getStripeInstance");

			// Setup environment variables
			process.env.STRIPE_UK_SECRET_KEY_LIVE = "sk_live_uk_12345";
			process.env.STRIPE_UK_SECRET_KEY_TEST = "sk_test_uk_12345";
			process.env.STRIPE_US_SECRET_KEY_LIVE = "sk_live_us_12345";
			process.env.STRIPE_US_SECRET_KEY_TEST = "sk_test_us_12345";

			Stripe = require("stripe");
			Stripe.mockImplementation((secretKey, config) => ({
				secretKey,
				config,
				id: "stripe_server_instance",
			}));

			const {
				getStripeInstance: importedFunction,
			} = require("@/app/lib/stripe/getStripeInstance");
			getStripeInstance = importedFunction;
		});

		afterEach(() => {
			delete process.env.STRIPE_UK_SECRET_KEY_LIVE;
			delete process.env.STRIPE_UK_SECRET_KEY_TEST;
			delete process.env.STRIPE_US_SECRET_KEY_LIVE;
			delete process.env.STRIPE_US_SECRET_KEY_TEST;
		});

		it("should create Stripe instance with UK test key for GBP currency", () => {
			getStripeInstance({ currency: "gbp", mode: "test" });

			expect(Stripe).toHaveBeenCalledWith("sk_test_uk_12345", {
				apiVersion: "2025-07-30.basil",
			});
		});

		it("should create Stripe instance with UK live key for GBP currency in live mode", () => {
			getStripeInstance({ currency: "gbp", mode: "live" });

			expect(Stripe).toHaveBeenCalledWith("sk_live_uk_12345", {
				apiVersion: "2025-07-30.basil",
			});
		});

		it("should create Stripe instance with UK test key for NOK currency", () => {
			getStripeInstance({ currency: "nok", mode: "test" });

			expect(Stripe).toHaveBeenCalledWith("sk_test_uk_12345", {
				apiVersion: "2025-07-30.basil",
			});
		});

		it("should create Stripe instance with UK live key for NOK currency in live mode", () => {
			getStripeInstance({ currency: "nok", mode: "live" });

			expect(Stripe).toHaveBeenCalledWith("sk_live_uk_12345", {
				apiVersion: "2025-07-30.basil",
			});
		});

		it("should create Stripe instance with US test key for USD currency", () => {
			getStripeInstance({ currency: "usd", mode: "test" });

			expect(Stripe).toHaveBeenCalledWith("sk_test_us_12345", {
				apiVersion: "2025-07-30.basil",
			});
		});

		it("should create Stripe instance with US live key for USD currency in live mode", () => {
			getStripeInstance({ currency: "usd", mode: "live" });

			expect(Stripe).toHaveBeenCalledWith("sk_live_us_12345", {
				apiVersion: "2025-07-30.basil",
			});
		});

		it("should default to test mode when mode not specified", () => {
			getStripeInstance({ currency: "gbp" });

			expect(Stripe).toHaveBeenCalledWith("sk_test_uk_12345", {
				apiVersion: "2025-07-30.basil",
			});
		});

		it("should throw error when secret key is missing for currency", () => {
			delete process.env.STRIPE_UK_SECRET_KEY_TEST;

			expect(() =>
				getStripeInstance({ currency: "gbp", mode: "test" }),
			).toThrow("Stripe secret key not found for the selected region/mode.");
		});

		it("should throw error for unsupported currency", () => {
			expect(() =>
				getStripeInstance({ currency: "eur", mode: "test" }),
			).toThrow("Stripe secret key not found for the selected region/mode.");
		});

		it("should return Stripe instance", () => {
			const result = getStripeInstance({ currency: "usd", mode: "test" });

			expect(result.id).toBe("stripe_server_instance");
			expect(result.secretKey).toBe("sk_test_us_12345");
		});

		it("should use correct API version", () => {
			const result = getStripeInstance({ currency: "gbp", mode: "test" });

			expect(result.config.apiVersion).toBe("2025-07-30.basil");
		});

		it("should handle case-sensitive currency codes", () => {
			expect(() =>
				getStripeInstance({ currency: "GBP", mode: "test" }),
			).toThrow("Stripe secret key not found for the selected region/mode.");
		});

		it("should handle both GBP and NOK with same UK keys", () => {
			const gbpInstance = getStripeInstance({ currency: "gbp", mode: "live" });
			const nokInstance = getStripeInstance({ currency: "nok", mode: "live" });

			expect(gbpInstance.secretKey).toBe("sk_live_uk_12345");
			expect(nokInstance.secretKey).toBe("sk_live_uk_12345");
		});

		it("should differentiate between US and UK instances", () => {
			const usInstance = getStripeInstance({ currency: "usd", mode: "test" });
			const ukInstance = getStripeInstance({ currency: "gbp", mode: "test" });

			expect(usInstance.secretKey).toBe("sk_test_us_12345");
			expect(ukInstance.secretKey).toBe("sk_test_uk_12345");
		});
	});
});
