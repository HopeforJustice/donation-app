const { object } = require("zod");

// Mock the Vercel Postgres module
jest.mock("@vercel/postgres");

describe("storeWebhookEvent", () => {
	let storeWebhookEvent;
	let sql;
	let consoleLogSpy;
	let consoleErrorSpy;
	let dateNowSpy;

	beforeEach(() => {
		jest.resetModules();

		// Clear environment variables
		delete process.env.VERCEL_ENV;

		// Import mock
		const postgres = require("@vercel/postgres");
		sql = postgres.sql;

		// Import function under test
		storeWebhookEvent = require("@/app/lib/db/storeWebhookEvent").default;

		// Spy on console methods
		consoleLogSpy = jest.spyOn(console, "log").mockImplementation();
		consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

		// Spy on Date.now to return a fixed timestamp
		dateNowSpy = jest.spyOn(Date, "now").mockReturnValue(1234);
	});

	afterEach(() => {
		jest.clearAllMocks();
		consoleLogSpy.mockRestore();
		consoleErrorSpy.mockRestore();
		dateNowSpy.mockRestore();
	});

	describe("inserting new events", () => {
		it("should insert a new event when it does not exist", async () => {
			const mockEvent = {
				id: "evt_123",
				type: "payment_intent.succeeded",
				currency: "usd",
			};

			// Mock no existing event
			sql.mockResolvedValueOnce({ rows: [] });

			// Mock successful insert
			sql.mockResolvedValueOnce({ rows: [{ id: 1 }] });

			const result = await storeWebhookEvent(
				mockEvent,
				"completed",
				"Payment successful",
				"const_456",
			);

			expect(result).toBe(1);
			expect(sql).toHaveBeenCalledTimes(2);
			expect(consoleLogSpy).toHaveBeenCalledWith(
				"Stored webhook event: evt_123 with status 'completed' (row id 1)",
			);
		});

		it("should handle event with meta.webhook_id as event id", async () => {
			const mockEvent = {
				meta: { webhook_id: "webhook_789" },
				resource_type: "payments",
				currency: "gbp",
			};

			sql.mockResolvedValueOnce({ rows: [] });
			sql.mockResolvedValueOnce({ rows: [{ id: 2 }] });

			const result = await storeWebhookEvent(
				mockEvent,
				"pending",
				"Pending payment",
			);

			expect(result).toBe(2);
			expect(consoleLogSpy).toHaveBeenCalledWith(
				"Stored webhook event: webhook_789 with status 'pending' (row id 2)",
			);
		});

		it("should use unknown_event_id(date now) when no id is available", async () => {
			const mockEvent = {
				type: "charge.failed",
				currency: "eur",
			};

			sql.mockResolvedValueOnce({ rows: [] });
			sql.mockResolvedValueOnce({ rows: [{ id: 3 }] });

			const result = await storeWebhookEvent(
				mockEvent,
				"failed",
				"Payment failed",
			);

			expect(result).toBe(3);
			expect(consoleLogSpy).toHaveBeenCalledWith(
				"Stored webhook event: unknown_event_id1234 with status 'failed' (row id 3)",
			);
		});

		it("should extract currency from nested data.object.currency", async () => {
			const mockEvent = {
				id: "evt_nested",
				type: "checkout.session.completed",
				data: {
					object: {
						currency: "nok",
					},
				},
			};

			sql.mockResolvedValueOnce({ rows: [] });
			sql.mockResolvedValueOnce({ rows: [{ id: 4 }] });

			const result = await storeWebhookEvent(
				mockEvent,
				"completed",
				"Session completed",
			);

			expect(result).toBe(4);
			expect(sql).toHaveBeenCalledTimes(2);
			const insertCall = sql.mock.calls[1];
			expect(insertCall[5].currency).toContain("nok");
		});

		it("should store all optional parameters", async () => {
			consoleLogSpy.mockRestore();
			const mockEvent = {
				id: "evt_full",
				type: "subscription.created",
				currency: "usd",
			};

			sql.mockResolvedValueOnce({ rows: [] });
			sql.mockResolvedValueOnce({ rows: [{ id: 5 }] });

			const result = await storeWebhookEvent(
				mockEvent,
				"active",
				"Subscription created",
				"const_123",
				"gc_456",
				"df_789",
				"sub_012",
			);

			expect(result).toBe(5);
			const insertCall = sql.mock.calls[1];
			expect(insertCall[1]).toBe(mockEvent.id);
			expect(insertCall[2]).toBe(mockEvent.type);
			expect(insertCall[3]).toBe("Subscription created");
			expect(insertCall[4]).toBe("active");
			expect(insertCall[5]).toEqual(
				expect.objectContaining({
					id: mockEvent.id,
					currency: mockEvent.currency,
				}),
			);
			expect(insertCall[6]).toBe("const_123");
			expect(insertCall[7]).toBe("gc_456");
			expect(insertCall[8]).toBe(true);
			expect(insertCall[9]).toBe("df_789");
			expect(insertCall[10]).toBe("sub_012");
		});

		it("should mark event as test when not in production", async () => {
			process.env.VERCEL_ENV = "test";

			const mockEvent = {
				id: "evt_test",
				type: "test.event",
				currency: "usd",
			};

			sql.mockResolvedValueOnce({ rows: [] });
			sql.mockResolvedValueOnce({ rows: [{ id: 6 }] });

			await storeWebhookEvent(mockEvent, "test", "Test event");
			const insertCall = sql.mock.calls[1];
			expect(insertCall[8]).toBe(true);

			expect(sql).toHaveBeenCalledTimes(2);
		});

		it("should mark event as not test when in production", async () => {
			process.env.VERCEL_ENV = "production";

			const mockEvent = {
				id: "evt_prod",
				type: "production.event",
				currency: "usd",
			};

			sql.mockResolvedValueOnce({ rows: [] });
			sql.mockResolvedValueOnce({ rows: [{ id: 7 }] });

			await storeWebhookEvent(mockEvent, "completed", "Production event");

			expect(sql).toHaveBeenCalledTimes(2);
		});
	});

	describe("updating existing events", () => {
		it("should update an existing event", async () => {
			const mockEvent = {
				id: "evt_existing",
				type: "payment_intent.succeeded",
				currency: "usd",
			};

			// Mock existing event found
			sql.mockResolvedValueOnce({ rows: [{ id: 10 }] });
			// Mock successful update
			sql.mockResolvedValueOnce({ rows: [{ id: 10 }] });

			const result = await storeWebhookEvent(
				mockEvent,
				"completed",
				"Updated status",
			);

			expect(result).toBe(10);
			expect(sql).toHaveBeenCalledTimes(2);
			expect(consoleLogSpy).toHaveBeenCalledWith(
				"Updated webhook event: evt_existing to status 'completed' (row id 10)",
			);
		});

		it("should update with new constituent_id when provided", async () => {
			const mockEvent = {
				id: "evt_update",
				type: "payment.confirmed",
				currency: "gbp",
			};

			sql.mockResolvedValueOnce({ rows: [{ id: 11 }] });
			sql.mockResolvedValueOnce({ rows: [{ id: 11 }] });

			const result = await storeWebhookEvent(
				mockEvent,
				"confirmed",
				"Payment confirmed",
				"new_const_999",
			);

			expect(result).toBe(11);
		});

		it("should preserve existing values when optional params are null", async () => {
			const mockEvent = {
				id: "evt_preserve",
				type: "refund.created",
				currency: "eur",
			};

			sql.mockResolvedValueOnce({ rows: [{ id: 12 }] });
			sql.mockResolvedValueOnce({ rows: [{ id: 12 }] });

			const result = await storeWebhookEvent(
				mockEvent,
				"refunded",
				"Refund processed",
				null,
				null,
				null,
				null,
			);

			expect(result).toBe(12);
		});
	});

	describe("error handling", () => {
		it("should return null when database query fails on insert", async () => {
			const mockEvent = {
				id: "evt_error",
				type: "error.event",
				currency: "usd",
			};

			sql.mockRejectedValue(new Error("Database connection failed"));

			const result = await storeWebhookEvent(mockEvent, "error", "Error event");

			expect(result).toBeNull();
			expect(consoleErrorSpy).toHaveBeenCalledWith(
				"Error storing webhook event:",
				expect.any(Error),
			);
		});

		it("should return null when update query fails", async () => {
			const mockEvent = {
				id: "evt_update_error",
				type: "update.error",
				currency: "gbp",
			};

			sql.mockResolvedValueOnce({ rows: [{ id: 20 }] });
			sql.mockRejectedValue(new Error("Update failed"));

			const result = await storeWebhookEvent(
				mockEvent,
				"error",
				"Update error",
			);

			expect(result).toBeNull();
			expect(consoleErrorSpy).toHaveBeenCalledWith(
				"Error storing webhook event:",
				expect.any(Error),
			);
		});

		it("should handle database timeout errors", async () => {
			const mockEvent = {
				id: "evt_timeout",
				type: "timeout.event",
				currency: "usd",
			};

			sql.mockRejectedValue(new Error("Query timeout"));

			const result = await storeWebhookEvent(mockEvent, "timeout", "Timeout");

			expect(result).toBeNull();
			expect(consoleErrorSpy).toHaveBeenCalled();
		});
	});

	describe("edge cases", () => {
		it("should handle event with missing currency", async () => {
			const mockEvent = {
				id: "evt_no_currency",
				type: "event.type",
			};

			sql.mockResolvedValueOnce({ rows: [] });
			sql.mockResolvedValueOnce({ rows: [{ id: 30 }] });

			const result = await storeWebhookEvent(
				mockEvent,
				"success",
				"No currency",
			);

			expect(result).toBe(30);
		});

		it("should handle empty additional notes", async () => {
			const mockEvent = {
				id: "evt_no_notes",
				type: "event.type",
				currency: "usd",
			};

			sql.mockResolvedValueOnce({ rows: [] });
			sql.mockResolvedValueOnce({ rows: [{ id: 31 }] });

			const result = await storeWebhookEvent(mockEvent, "success", "");

			expect(result).toBe(31);
		});

		it("should handle resource_type instead of type", async () => {
			const mockEvent = {
				id: "evt_resource",
				resource_type: "mandates",
				currency: "gbp",
			};

			sql.mockResolvedValueOnce({ rows: [] });
			sql.mockResolvedValueOnce({ rows: [{ id: 32 }] });

			await storeWebhookEvent(mockEvent, "created", "Mandate created");

			expect(sql).toHaveBeenCalledTimes(2);
		});

		it("should use webhook as default event type", async () => {
			const mockEvent = {
				id: "evt_no_type",
				currency: "usd",
			};

			sql.mockResolvedValueOnce({ rows: [] });
			sql.mockResolvedValueOnce({ rows: [{ id: 33 }] });

			await storeWebhookEvent(mockEvent, "received", "No type");

			expect(sql).toHaveBeenCalledTimes(2);
		});
	});
});
