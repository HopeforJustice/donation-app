import getDonorfyCredentials from "@/app/lib/donorfy/getDonorfyCredentials";
import makeDonorfyRequest from "@/app/lib/donorfy/makeDonorfyRequest";

export async function createTransaction(
	product,
	amount,
	campaign,
	channel,
	paymentMethod,
	fund,
	constituentId,
	instance
) {
	try {
		const { apiKey, tenant } = getDonorfyCredentials(instance);
		const authString = Buffer.from(`DonationApp:${apiKey}`).toString("base64");

		const url = `https://data.donorfy.com/api/v1/${tenant}/transactions`;

		const body = {
			Product: product,
			Amount: amount,
			Campaign: campaign,
			Channel: channel,
			PaymentMethod: paymentMethod,
			Fund: fund,
			ExistingConstituentId: constituentId,
			DatePaid: new Date().toISOString(),
		};

		console.log(url);

		const responseData = await makeDonorfyRequest(
			url,
			"POST",
			authString,
			body
		);

		if (responseData) {
			return {
				success: true,
				message: "Create transaction successful",
			};
		}
	} catch (error) {
		console.error("Error:", error);
		throw new Error("Create transaction not successful");
	}
}
