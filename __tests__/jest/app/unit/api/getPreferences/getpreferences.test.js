//mock next server
jest.mock("next/server");
//mock utils - provide getDonorfyClient as a mock function
jest.mock("@/app/lib/utils", () => ({
	getDonorfyClient: jest.fn(),
}));

const preferencesMockArray = [
	{
		DateAdded: "2025-07-24T14:53:13.3301635",
		DateChanged: "2026-01-14T10:28:08.3284861",
		PreferenceType: "Channel",
		PreferenceName: "Email",
		PreferenceAllowed: true,
	},
	{
		DateAdded: "2025-07-24T14:53:13.5645242",
		DateChanged: "2026-01-14T10:28:08.4378597",
		PreferenceType: "Channel",
		PreferenceName: "Mail",
		PreferenceAllowed: true,
	},
	{
		DateAdded: "2025-07-24T14:53:13.7832761",
		DateChanged: "2026-01-14T10:28:08.5472365",
		PreferenceType: "Channel",
		PreferenceName: "Phone",
		PreferenceAllowed: true,
	},
	{
		DateAdded: "2025-07-24T14:53:13.970743",
		DateChanged: "2026-01-14T10:28:08.6409861",
		PreferenceType: "Channel",
		PreferenceName: "SMS",
		PreferenceAllowed: true,
	},
	{
		DateAdded: "2025-07-24T14:53:13.033222",
		DateChanged: "2025-12-08T12:23:10.7587916",
		PreferenceType: "Purpose",
		PreferenceName: "Hope Challenge",
		PreferenceAllowed: null,
	},
	{
		DateAdded: "2025-07-24T14:53:12.7832092",
		DateChanged: "2025-12-08T12:23:08.6794435",
		PreferenceType: "Purpose",
		PreferenceName: "G7th Event",
		PreferenceAllowed: null,
	},
	{
		DateAdded: "2025-07-24T14:53:12.5175792",
		DateChanged: "2026-01-14T10:28:08.203488",
		PreferenceType: "Purpose",
		PreferenceName: "Email Updates",
		PreferenceAllowed: true,
	},
];

describe("Get preferences API Route", () => {
	let POST;
	let req;
	let donorfy;

	beforeEach(() => {
		jest.clearAllMocks();

		//default mock of getDonorfyClient
		donorfy = {
			duplicateCheck: jest.fn(),
			getConstituentPreferences: jest.fn(),
		};

		//default mock of duplicateCheck - needs to return an array
		donorfy.duplicateCheck.mockResolvedValue([
			{
				ConstituentId: "12345",
			},
		]);
		//default mock of getConstituentPreferences - preferences in PreferencesList
		donorfy.getConstituentPreferences.mockResolvedValue({
			PreferencesList: preferencesMockArray,
		});
		const { getDonorfyClient } = require("@/app/lib/utils");
		getDonorfyClient.mockReturnValue(donorfy);

		//default mock of NextResponse.json
		const { NextResponse } = require("next/server");
		NextResponse.json = jest.fn((data, options) => ({
			data,
			status: options?.status,
		}));

		//default mock request
		req = {
			json: async () => ({ email: "test@test.com" }),
		};

		// function to test
		POST = require("@/app/api/getPreferences/route").POST;
	});

	afterEach(() => {});

	it("should return a preferences array", async () => {
		const response = await POST(req);
		expect(response.status).toBe(200);
		expect(response.data.preferences).toEqual(
			expect.arrayContaining(preferencesMockArray),
		);
	});

	it("should return null preferences if timeout occurs", async () => {
		donorfy.duplicateCheck.mockImplementation(
			() =>
				new Promise((resolve) =>
					setTimeout(() => resolve({ constituentId: "12345" }), 3000),
				),
		);

		const response = await POST(req);

		expect(response.status).toBe(200);
		expect(response.data.preferences).toBeNull();
	});
});
