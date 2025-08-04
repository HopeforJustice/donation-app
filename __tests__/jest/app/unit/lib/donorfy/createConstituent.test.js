import { createConstituent } from "@/app/lib/donorfy/old/createConstituent";
import getDonorfyCredentials from "@/app/lib/donorfy/old/getDonorfyCredentials";
import makeDonorfyRequest from "@/app/lib/donorfy/old/makeDonorfyRequest";

jest.mock("@/app/lib/donorfy/getDonorfyCredentials");
jest.mock("@/app/lib/donorfy/makeDonorfyRequest");

describe("createConstituent (unit)", () => {
	const testData = {
		title: "Mr",
		firstName: "Harry",
		lastName: "Potter",
		address1: "4 Privet Drive",
		address2: "Little Whinging",
		townCity: "Surrey",
		stateCounty: "England",
		country: "United Kingdom",
		postcode: "12345",
		email: "harry.potter@hogwarts.com",
		phone: "12345678910",
		campaign: "TESTCAMPAIGN",
	};

	it("calls Donorfy with correct params and returns constituentId", async () => {
		getDonorfyCredentials.mockReturnValue({
			apiKey: "fake-key",
			tenant: "fake-tenant",
		});
		makeDonorfyRequest.mockResolvedValue({
			result: "created",
			ConstituentId: "test-123",
		});

		const result = await createConstituent(testData, "uk");

		expect(getDonorfyCredentials).toHaveBeenCalledWith("uk");
		expect(makeDonorfyRequest).toHaveBeenCalledWith(
			"https://data.donorfy.com/api/v1/fake-tenant/constituents/",
			"POST",
			Buffer.from(`DonationApp:fake-key`).toString("base64"),
			{
				ConstituentType: "individual",
				Title: "Mr",
				FirstName: "Harry",
				LastName: "Potter",
				AddressLine1: "4 Privet Drive",
				AddressLine2: "Little Whinging",
				Town: "Surrey",
				County: "England",
				Country: "United Kingdom",
				PostalCode: "12345",
				EmailAddress: "harry.potter@hogwarts.com",
				Phone1: "12345678910",
				RecruitmentCampaign: "TESTCAMPAIGN",
			}
		);
		expect(result).toEqual({ constituentId: "test-123" });
	});

	it("throws a helpful error when request fails", async () => {
		getDonorfyCredentials.mockReturnValue({
			apiKey: "fake-key",
			tenant: "fake-tenant",
		});
		makeDonorfyRequest.mockRejectedValue(new Error("API error"));

		await expect(createConstituent(testData, "uk")).rejects.toThrow(
			"Create Constituent failed, error: API error"
		);
	});
});
