import { useState, useEffect } from "react";
import Button from "./Button";
import { findCurrencySymbol } from "@/app/lib/utilities";
import { useSearchParams } from "next/navigation";

export default function SubmitButton({ amount, currency, givingFrequency }) {
	const [show, setShow] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);

	useEffect(() => {
		const onShow = () => setShow(true);
		const onSubmitting = (e) => setIsSubmitting(!!e.detail);

		window.addEventListener("donation:showButton", onShow);
		window.addEventListener("donation:submitting", onSubmitting);

		return () => {
			window.removeEventListener("donation:showButton", onShow);
			window.removeEventListener("donation:submitting", onSubmitting);
		};
	}, []);

	// NEW: show immediately for GoCardless flow
	useEffect(() => {
		if (currency === "gbp" && givingFrequency === "monthly") {
			setShow(true);
		}
	}, [currency, givingFrequency]);

	if (!show) return null;

	return (
		<Button
			testId="donate-button"
			extraClasses="w-full pt-4 pb-4 text-lg flex items-center justify-center"
			onClick={() => window.dispatchEvent(new Event("donation:requestSubmit"))}
			text={
				isSubmitting
					? "Submitting..."
					: `Donate ${findCurrencySymbol(currency)}${amount}${
							givingFrequency === "monthly" ? " monthly" : ""
					  }`
			}
			disabled={isSubmitting}
			buttonType="confirm"
			size="extraLarge"
		/>
	);
}
