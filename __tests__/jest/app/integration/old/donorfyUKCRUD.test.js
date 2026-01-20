/**
 * @jest-environment node
 */
import DonorfyClient from "@/app/lib/donorfy/donorfyClient";
const donorfyUK = new DonorfyClient(
	process.env.DONORFY_UK_KEY,
	process.env.DONORFY_UK_TENANT
);

describe("Integration Test: Donorfy UK CRUD", () => {
	let constituentId;
	let transactionId;
	const tags = "Gocardless_Active Subscription,Relationship Owner_Britta Lam";
	const tagToRemove = "Relationship Owner_Britta Lam";
	const tagToRemain = "Gocardless_Active Subscription";
	const testEmail = `harry.potter+${Date.now()}@hogwarts.com`;
	const campaign = "Test";

	const activityData = {
		ActivityType: "Gocardless Subscription",
		Notes: "Testing Notes",
		Campaign: campaign,
		Number1: 10,
	};

	const constituentData = {
		Title: "Mr",
		FirstName: "Harry",
		MiddleName: "James",
		LastName: "Potter",
		RecruitmentCampaign: campaign,
		ConstituentType: "individual",
		AddressLine1: "4 Privet Drive",
		AddressLine2: "Little Whinging",
		Town: "Surrey",
		County: "London",
		Country: "United Kingdom",
		PostalCode: "TEST123",
		Phone1: "12345678910",
		EmailAddress: testEmail,
	};

	it("Should create a constituent", async () => {
		const constituent = await donorfyUK.createConstituent(constituentData);
		expect(constituent).toEqual(
			expect.objectContaining({
				ConstituentId: expect.any(String),
			})
		);
		constituentId = constituent.ConstituentId;
	}, 10000);
	it("Should perform a duplicate check and return the same constituent", async () => {
		let result = await donorfyUK.duplicateCheck({ EmailAddress: testEmail });
		result = result[0];
		expect(result).toEqual(
			expect.objectContaining({ ConstituentId: constituentId })
		);
	}, 10000);
	it("Should update and get the constituent's preferences", async () => {
		const data = {
			PreferencesList: [
				{
					PreferenceType: "Channel",
					PreferenceName: "Email",
					PreferenceAllowed: true,
				},
				{
					PreferenceType: "Channel",
					PreferenceName: "Mail",
					PreferenceAllowed: true,
				},
				{
					PreferenceType: "Channel",
					PreferenceName: "Phone",
					PreferenceAllowed: true,
				},
				{
					PreferenceType: "Channel",
					PreferenceName: "SMS",
					PreferenceAllowed: true,
				},
				{
					PreferenceType: "Purpose",
					PreferenceName: "Email Updates",
					PreferenceAllowed: true,
				},
			],
		};
		await donorfyUK.updateConstituentPreferences(constituentId, data);
		let result = await donorfyUK.getConstituentPreferences(constituentId);

		for (const preference of data.PreferencesList) {
			expect(result.PreferencesList).toEqual(
				expect.arrayContaining([expect.objectContaining(preference)])
			);
		}
	}, 10000);
	it("Should add a GiftAid declaration", async () => {
		const data = {
			TaxPayerTitle: constituentData.Title,
			TaxPayerFirstName: constituentData.FirstName,
			TaxPayerLastName: constituentData.LastName,
		};
		const result = await donorfyUK.createGiftAidDeclaration(
			constituentId,
			data
		);
		expect(result).toEqual(expect.any(Object));
	}, 10000);
	it("Should add tags to the constituent", async () => {
		const result = await donorfyUK.addActiveTags(constituentId, tags);
		expect(result).toEqual(expect.any(Object));
	}, 10000);
	it("Should read and confirm the active tags", async () => {
		const result = await donorfyUK.getConstituentTags(constituentId);
		expect(result).toEqual(expect.stringContaining(tags));
	}, 10000);
	it("Should remove a tag", async () => {
		await donorfyUK.removeTag(constituentId, tagToRemove);
	}, 10000);
	it("Should read and confirm the removal of the tag", async () => {
		const result = await donorfyUK.getConstituentTags(constituentId);
		expect(result).toEqual(tagToRemain);
	});
	it("Should update the constituent's last name", async () => {
		await donorfyUK.updateConstituent(constituentId, {
			LastName: "Granger",
		});
	}, 10000);
	it("Should confirm the constituent's last name changed", async () => {
		const result = await donorfyUK.getConstituent(constituentId);
		expect(result).toEqual(expect.objectContaining({ LastName: "Granger" }));
	}, 10000);
	it("Should add an Activity to the Constituent", async () => {
		const result = await donorfyUK.addActivity({
			...activityData,
			ExistingConstituentId: constituentId,
		});
		console.log("addActivityResult:", result);
		expect(result).toEqual(expect.any(Object));
	}, 10000);
	it("Should confirm the Activity data", async () => {
		const result = await donorfyUK.getConstituentActivities(constituentId);
		console.log("getActivitiesResult:", result.ActivitiesList[0]);
		expect(result.ActivitiesList[0]).toEqual(
			expect.objectContaining(activityData)
		);
	}, 10000);
	it("Should add a Transaction to the Constituent", async () => {
		const result = await donorfyUK.createTransaction(
			10,
			campaign,
			"GoCardless DD",
			constituentId
		);
		transactionId = result.Id;
		expect(result).toEqual(expect.any(Object));
	}, 10000);
	it("Should confirm the Transaction", async () => {
		const result = await donorfyUK.getTransaction(transactionId);
		console.log("get transaction result:", result);
		expect(result).toEqual(expect.any(Object));
	}, 10000);
	it("Should delete the Transaction", async () => {
		const result = await donorfyUK.deleteTransaction(transactionId);
		expect(result).toEqual(expect.any(Object));
	}, 10000);
	it("Should delete that constituent", async () => {
		const result = await donorfyUK.deleteConstituent(constituentId);
		expect(result).toEqual(expect.any(Object));
	}, 10000);
});
