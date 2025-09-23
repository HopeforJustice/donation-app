import { getPayPalAccessToken } from "./getPayPalAccessToken";
import { getPayPalBaseUrl } from "./getPayPalCredentials";

/**
 * Capture a PayPal order after payment approval
 */
export async function capturePayPalOrder({ orderID, mode = "test", formData }) {
	try {
		// Use the currency from form data - we already know it
		const accessToken = await getPayPalAccessToken(formData.currency, mode);
		const baseURL = getPayPalBaseUrl(mode);

		// Capture the payment directly
		const captureResponse = await fetch(
			`${baseURL}/v2/checkout/orders/${orderID}/capture`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${accessToken}`,
				},
			}
		);

		if (!captureResponse.ok) {
			const errorData = await captureResponse.json();
			console.error("PayPal capture failed:", errorData);
			throw new Error("Failed to capture PayPal payment");
		}

		const captureData = await captureResponse.json();

		// Check if capture was successful
		if (captureData.status !== "COMPLETED") {
			throw new Error("PayPal payment capture was not completed");
		}

		// Extract payment details
		const capture = captureData.purchase_units[0].payments.captures[0];

		// Extract funding source information (including Venmo detection)
		const paymentSource = captureData.payment_source || {};
		const fundingSource =
			paymentSource.paypal?.funding_source || paymentSource.venmo
				? "venmo"
				: "paypal";

		const paymentDetails = {
			paypalOrderId: orderID,
			paypalCaptureId: capture.id,
			amount: parseFloat(capture.amount.value),
			currency: capture.amount.currency_code,
			status: capture.status,
			createTime: capture.create_time,
			updateTime: capture.update_time,
			fundingSource: fundingSource, // 'venmo' or 'paypal'
			paymentMethod: fundingSource === "venmo" ? "Venmo" : "PayPal",
		};

		console.log("PayPal payment captured successfully:", {
			orderID,
			captureId: capture.id,
			amount: capture.amount.value,
			currency: capture.amount.currency_code,
			fundingSource: fundingSource,
			paymentMethod: paymentDetails.paymentMethod,
		});

		return {
			success: true,
			orderID,
			captureID: capture.id,
			paymentDetails,
		};
	} catch (error) {
		console.error("Error capturing PayPal payment:", error);
		throw error;
	}
}
