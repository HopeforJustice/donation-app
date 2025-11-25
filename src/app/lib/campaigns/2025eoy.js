/* 
2025 EOY Campaign specific workflows
*/
import sendEmailByTemplateName from "../sparkpost/sendEmailByTemplateName";

const test = process.env.VERCEL_ENV !== "production";

export default async function EOY2025(formData, currency, amount) {
	const currencySymbol = currency === "gbp" ? "£" : "$";
	const sparkPostTemplate =
		currency === "gbp"
			? "donation-receipt-uk-doubled"
			: "donation-receipt-us-doubled";
	const substitutionData = {
		amount: `${currencySymbol}${amount}`,
		doubledAmount: `${currencySymbol}${amount * 2}`,
		name: formData.firstName,
	};

	try {
		await sendEmailByTemplateName(
			sparkPostTemplate,
			formData.email,
			substitutionData
		);
	} catch (error) {
		console.error("Error sending EOY2025 donation receipt email:", error);
	}
}
