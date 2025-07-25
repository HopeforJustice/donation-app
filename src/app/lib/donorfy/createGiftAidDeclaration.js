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
		await makeDonorfyRequest(url, "POST", authString, donorfyData);
	} catch (error) {
		throw new Error(
			`Create Gift Aid Declaration failed, error: ${error.message}, constituentId: ${constituentId}`
		);
	}
}
