import getProcessedEvent from "@/app/lib/db/getProcessedEvent";

describe("Integration Test: Get event", () => {
	it("Should get the latest billing request event", async () => {
		const result = await getProcessedEvent(null, "billing_requests");
		expect(result.event_type).toEqual("billing_requests");
	});
});
