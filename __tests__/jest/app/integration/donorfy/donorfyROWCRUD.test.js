/**
 * @jest-environment node
 */
import { getDonorfyClient } from "@/app/lib/utils";
const donorfy = getDonorfyClient("row"); //ensure keys are loaded

describe("Integration Test: Donorfy ROW CRUD", () => {
	let constituentId;
	let transactionId;
	const tags = "Stripe_Active Subscription,Supporter Type_Influencer";
	const tagToRemove = "Supporter Type_Influencer";
	const tagToRemain = "Stripe_Active Subscription";
	const testEmail = `harry.potter+${Date.now()}@hogwarts.com`;
	const campaign = "Donation App General Campaign";

	const activityData = {
		ActivityType: "Stripe Subscription Created",
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
		const constituent = await donorfy.createConstituent(constituentData);
		expect(constituent).toEqual(
			expect.objectContaining({
				ConstituentId: expect.any(String),
			}),
		);
		constituentId = constituent.ConstituentId;
	}, 10000);
	it("Should perform a duplicate check and return the same constituent", async () => {
		let result = await donorfy.duplicateCheck({ EmailAddress: testEmail });
		result = result[0];
		expect(result).toEqual(
			expect.objectContaining({ ConstituentId: constituentId }),
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
		await donorfy.updateConstituentPreferences(constituentId, data);
		let result = await donorfy.getConstituentPreferences(constituentId);

		for (const preference of data.PreferencesList) {
			expect(result.PreferencesList).toEqual(
				expect.arrayContaining([expect.objectContaining(preference)]),
			);
		}
	}, 10000);
	it("Should add tags to the constituent", async () => {
		const result = await donorfy.addActiveTags(constituentId, tags);
		expect(result).toEqual(expect.any(Object));
	}, 10000);
	it("Should read and confirm the active tags", async () => {
		const result = await donorfy.getConstituentTags(constituentId);
		expect(result).toEqual(expect.stringContaining(tags));
	}, 10000);
	it("Should remove a tag", async () => {
		await donorfy.removeTag(constituentId, tagToRemove);
	}, 10000);
	it("Should read and confirm the removal of the tag", async () => {
		const result = await donorfy.getConstituentTags(constituentId);
		expect(result).toEqual(tagToRemain);
	});
	it("Should update the constituent's last name", async () => {
		await donorfy.updateConstituent(constituentId, {
			LastName: "Granger",
		});
	}, 10000);
	it("Should confirm the constituent's last name changed", async () => {
		const result = await donorfy.getConstituent(constituentId);
		expect(result).toEqual(expect.objectContaining({ LastName: "Granger" }));
	}, 10000);
	it("Should add an Activity to the Constituent", async () => {
		const result = await donorfy.addActivity({
			...activityData,
			ExistingConstituentId: constituentId,
		});
		console.log("addActivityResult:", result);
		expect(result).toEqual(expect.any(Object));
	}, 10000);
	it("Should confirm the Activity data", async () => {
		const result = await donorfy.getConstituentActivities(constituentId);
		console.log("getActivitiesResult:", result.ActivitiesList[0]);
		expect(result.ActivitiesList[0]).toEqual(
			expect.objectContaining(activityData),
		);
	}, 10000);
	it("Should add a Transaction to the Constituent", async () => {
		const result = await donorfy.createTransaction(
			10,
			campaign,
			"Stripe Checkout",
			constituentId,
		);
		transactionId = result.Id;
		expect(result).toEqual(expect.any(Object));
	}, 10000);
	it("Should confirm the Transaction", async () => {
		const result = await donorfy.getTransaction(transactionId);
		console.log("get transaction result:", result);
		expect(result).toEqual(expect.any(Object));
	}, 10000);
	it("Should delete the Transaction", async () => {
		const result = await donorfy.deleteTransaction(transactionId);
		expect(result).toEqual(expect.any(Object));
	}, 10000);
	it("Should delete that constituent", async () => {
		const result = await donorfy.deleteConstituent(constituentId);
		expect(result).toEqual(expect.any(Object));
	}, 10000);
}, 30000);
