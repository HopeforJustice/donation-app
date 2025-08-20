"use client";
import { CheckoutProvider } from "@stripe/react-stripe-js";
import { useState, useEffect, use } from "react";
import { loadStripe } from "@stripe/stripe-js";
import StripePaymentElement from "./StripePaymentElement";
import { useFormContext } from "react-hook-form";
import { useSearchParams } from "next/navigation";

export default function StripePaymentStep({
	amount,
	currency,
	givingFrequency,
}) {
	const { getValues } = useFormContext();
	const formData = getValues();
	const searchParams = useSearchParams();
	const [stripePromise, setStripePromise] = useState(null);
	const [clientSecret, setClientSecret] = useState(null);
	useEffect(() => {
		fetch("/api/createCheckoutSession", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				amount,
				currency,
				givingFrequency,
				email: formData.email,
				metadata: {
					title: formData.title || "",
					firstName: formData.firstName || "",
					lastName: formData.lastName || "",
					email: formData.email || "",
					phone: formData.phone || "",
					fund: formData.fund || "unrestricted",
					inspiration: formData.inspirationQuestion || "",
					address1: formData.address1 || "",
					address2: formData.address2 || "",
					postcode: formData.postcode || "",
					country: formData.country || "",
					stateCounty: formData.stateCounty || "",
					townCity: formData.townCity || "",
					giftAid: formData.giftAid || "",
					emailPreference:
						formData.currency === "usd" ? true : formData.emailPreference || "",
					postPreference:
						formData.currency === "usd" ? true : formData.postPreference || "",
					smsPreference:
						formData.currency === "usd" ? true : formData.smsPreference || "",
					phonePreference:
						formData.currency === "usd" ? true : formData.phonePreference || "",
					inspirationDetails: formData.inspirationDetails || "",
					campaign: formData.campaign || "",
					source: "donation-app",
					utmSource: searchParams.get("utm_source") || "",
					utmMedium: searchParams.get("utm_medium") || "",
					utmCampaign: searchParams.get("utm_campaign") || "",
					sparkPostTemplate: formData.sparkPostTemplate || "",
				},
			}),
		})
			.then((res) => res.json())
			.then((data) => {
				setClientSecret(data.clientSecret);
				setStripePromise(loadStripe(data.publishableKey));
			});
	}, [
		amount,
		currency,
		givingFrequency,
		formData.email,
		formData.title,
		formData.firstName,
		formData.lastName,
		formData.phone,
		formData.fund,
		formData.channel,
		formData.inspiration,
		formData.address1,
		formData.address2,
		formData.postcode,
		formData.country,
		formData.stateCounty,
		formData.emailPreference,
		formData.postPreference,
		formData.smsPreference,
		formData.phonePreference,
		formData.inspirationDetails,
		formData.campaign,
		formData.giftAid,
		searchParams,
		formData.inspirationQuestion,
		formData.townCity,
		formData.currency,
	]);

	if (!clientSecret) {
		return (
			<div className="flex flex-col gap-4">
				<div className="w-full h-12 rounded-lg animate-pulse bg-gray-200"></div>
				<div className="w-full h-12 rounded-lg animate-pulse bg-gray-200"></div>
			</div>
		);
	}
	return (
		<CheckoutProvider
			stripe={stripePromise}
			key={clientSecret}
			options={{
				fetchClientSecret: () => Promise.resolve(clientSecret),
				elementsOptions: {
					appearance: { theme: "stripe" },
				},
			}}
		>
			<StripePaymentElement />
		</CheckoutProvider>
	);
}
