import { generateSteps } from "@/app/lib/steps/generateSteps";

describe("Generate steps for multiStep Form", () => {
	it("Should generate steps based on currency and frequency", async () => {
		const result = generateSteps({ currency: "gbp", frequency: "monthly" });
		console.dir(result, { depth: 5 });
		expect(result).toEqual(expect.any(Object));
	});
});
