import { deleteConstituent } from "@/app/lib/donorfy/old/deleteConstituent";
import getDonorfyCredentials from "@/app/lib/donorfy/old/getDonorfyCredentials";
import makeDonorfyRequest from "@/app/lib/donorfy/old/makeDonorfyRequest";

jest.mock("@/app/lib/donorfy/getDonorfyCredentials");
jest.mock("@/app/lib/donorfy/makeDonorfyRequest");

describe("deleteConstituent (unit)", () => {
	it("calls Donorfy with correct params and returns responseData", async () => {
		getDonorfyCredentials.mockReturnValue({
			apiKey: "fake-key",
			tenant: "fake-tenant",
		});
		makeDonorfyRequest.mockResolvedValue({ result: "deleted" });

		const result = await deleteConstituent("constituent-123", "uk");

		expect(getDonorfyCredentials).toHaveBeenCalledWith("uk");
		expect(makeDonorfyRequest).toHaveBeenCalledWith(
			"https://data.donorfy.com/api/v1/fake-tenant/constituents/constituent-123",
			"DELETE",
			Buffer.from(`DonationApp:fake-key`).toString("base64")
		);
		expect(result).toEqual({ responseData: { result: "deleted" } });
	});

	it("throws a helpful error when request fails", async () => {
		getDonorfyCredentials.mockReturnValue({
			apiKey: "fake-key",
			tenant: "fake-tenant",
		});
		makeDonorfyRequest.mockRejectedValue(new Error("API error"));

		await expect(deleteConstituent("constituent-123", "uk")).rejects.toThrow(
			"Delete Constituent failed, error: API error"
		);
	});
});
