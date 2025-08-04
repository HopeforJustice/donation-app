import getDonorfyCredentials from "@/app/lib/donorfy/old/getDonorfyCredentials";
import makeDonorfyRequest from "@/app/lib/donorfy/old/makeDonorfyRequest";

export async function createTransaction(
	product,
	amount,
	campaign,
	channel,
	paymentMethod,
	fund,
	constituentId,
	instance,
	chargeDate
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
			DatePaid: chargeDate || new Date().toISOString(),
		};

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
		throw new Error(
			`Create Transaction failed, error: ${error.message}, constituentId: ${constituentId}`
		);
	}
}
