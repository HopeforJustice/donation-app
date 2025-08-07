"use client";
import { CheckoutProvider } from "@stripe/react-stripe-js";
import { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import StripePaymentElement from "./StripePaymentElement";

export default function StripePaymentStep({
	amount,
	currency,
	givingFrequency,
}) {
	const [stripePromise, setStripePromise] = useState(() =>
		loadStripe(process.env.NEXT_PUBLIC_STRIPE_UK_PUBLISHABLE_KEY_TEST)
	);
	const [clientSecret, setClientSecret] = useState(null);
	useEffect(() => {
		fetch("/api/createCheckoutSession", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ amount, currency, givingFrequency }),
		})
			.then((res) => res.json())
			.then((data) => setClientSecret(data.clientSecret));
	}, [amount, currency, givingFrequency]);

	if (!clientSecret) {
		return <div>Loading payment form...</div>;
	}
	return (
		<CheckoutProvider
			stripe={stripePromise}
			key={clientSecret}
			options={{
				fetchClientSecret: () => Promise.resolve(clientSecret),
				elementsOptions: { appearance: { theme: "stripe" } },
			}}
		>
			<div>
				{amount},{givingFrequency}, {currency}
			</div>
			<StripePaymentElement />
		</CheckoutProvider>
	);
}

// //testing stripe
// if (formData.givingFrequency !== "monthly") {
// 	const updateEmail = await checkout.updateEmail(formData.email);
// 	if (!updateEmail) return;
// 	const confirmResult = await checkout.confirm();

// 	// This point will only be reached if there is an immediate error when
// 	// confirming the payment. Otherwise, your customer will be redirected to
// 	// your `return_url`. For some payment methods like iDEAL, your customer will
// 	// be redirected to an intermediate site first to authorize the payment, then
// 	// redirected to the `return_url`.
// 	if (confirmResult.type === "error") {
// 		alert(confirmResult.error.message);
// 		// setMessage(confirmResult.error.message);
// 	}
// }
