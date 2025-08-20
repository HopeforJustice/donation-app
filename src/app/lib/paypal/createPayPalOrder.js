import { getPayPalAccessToken } from "./getPayPalAccessToken";
import { getPayPalBaseUrl } from "./getPayPalCredentials";

/**
 * Create a PayPal order
 */
export async function createPayPalOrder({
	amount,
	currency,
	mode = "test",
	formData,
}) {
	const accessToken = await getPayPalAccessToken(currency, mode);
	const baseURL = getPayPalBaseUrl(mode);

	// Create order payload based on PayPal's recommended structure
	const orderPayload = {
		intent: "CAPTURE",
		purchase_units: [
			{
				custom_id: `donation_${Date.now()}`, // Simple identifier for reconciliation
				invoice_id: `INV_${Date.now()}`, // Invoice reference
				description: "One-time donation",
				amount: {
					currency_code: currency.toUpperCase(),
					value: amount.toString(),
				},
				reference_id: `ref_${Date.now()}`, // Reference ID for tracking
			},
		],
		payment_source: {
			paypal: {
				experience_context: {
					payment_method_preference: "IMMEDIATE_PAYMENT_REQUIRED",
					payment_method_selected: "PAYPAL",
					brand_name: "Hope for Justice",
					landing_page: "LOGIN",
					shipping_preference: "NO_SHIPPING",
					user_action: "PAY_NOW",
					return_url: `${process.env.NEXT_PUBLIC_API_URL}/success`,
					cancel_url: `${process.env.NEXT_PUBLIC_API_URL}/`,
				},
			},
		},
	};

	// Create PayPal order
	const orderResponse = await fetch(`${baseURL}/v2/checkout/orders`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${accessToken}`,
		},
		body: JSON.stringify(orderPayload),
	});

	if (!orderResponse.ok) {
		const errorData = await orderResponse.json();
		console.error("PayPal order creation failed:", errorData);
		throw new Error("Failed to create PayPal order");
	}

	const orderData = await orderResponse.json();

	return {
		orderID: orderData.id,
		orderData,
	};
}
