import getDonorfyCredentials from "@/app/lib/donorfy/getDonorfyCredentials";
import makeDonorfyRequest from "@/app/lib/donorfy/makeDonorfyRequest";

export async function createGiftAidDeclaration(data, constituentId, instance) {
	try {
		const { apiKey, tenant } = getDonorfyCredentials(instance);
		const authString = Buffer.from(`DonationApp:${apiKey}`).toString("base64");

		const date = new Date();
		date.setFullYear(date.getFullYear() + 100);
		const futureDate = date.toISOString();
		const dateNow = new Date().toISOString();

		const donorfyData = {
			DeclarationMethod: "Web",
			TaxPayerTitle: data.title || "Mr",
			TaxPayerFirstName: data.firstName,
			TaxPayerLastName: data.lastName,
			DeclarationDate: dateNow,
			DeclarationStartDate: dateNow,
			DeclarationEndDate: futureDate,
		};

		const url = `https://data.donorfy.com/api/v1/${tenant}/constituents/${constituentId}/GiftAidDeclarations`;
		const responseData = await makeDonorfyRequest(
			url,
			"POST",
			authString,
			donorfyData
		);

		return {
			message: "Create Gift Aid declaration successful",
			constituentId: responseData.ConstituentId,
		};
	} catch (error) {
		console.error("Error:", error);
		throw new Error("Create Gift Aid declaration failed");
	}
}
