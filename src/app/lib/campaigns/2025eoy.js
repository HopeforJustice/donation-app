/* 
2025 EOY Campaign specific workflows
*/
import sendEmailByTemplateName from "../sparkpost/sendEmailByTemplateName";

const test = process.env.VERCEL_ENV !== "production";

export default async function EOY2025(metadata, currency, amount) {
	const currencySymbol = currency === "gbp" ? "£" : "$";
	const sparkPostTemplate =
		currency === "gbp"
			? "donation-receipt-uk-doubled"
			: "donation-receipt-us-doubled";
	const substitutionData = {
		amount: `${currencySymbol}${parseFloat(amount).toFixed(2)}`,
		doubledAmount: `${currencySymbol}${parseFloat(amount * 2).toFixed(2)}`,
		name: metadata.firstName,
	};

	try {
		await sendEmailByTemplateName(
			sparkPostTemplate,
			metadata.email,
			substitutionData
		);
	} catch (error) {
		console.error("Error sending EOY2025 donation receipt email:", error);
	}
}
