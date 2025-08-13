import { useEffect } from "react";
import { PaymentElement, useCheckout } from "@stripe/react-stripe-js";
import { useFormContext } from "react-hook-form";
import { useSearchParams } from "next/navigation";

export default function StripePaymentElement() {
	const checkout = useCheckout();
	const { getValues, setError /*, trigger */ } = useFormContext();
	const searchParams = useSearchParams();
	if (searchParams.get("test")) {
		window.dispatchEvent(new Event("donation:showButton"));
	}

	useEffect(() => {
		async function handleConfirm() {
			window.dispatchEvent(
				new CustomEvent("donation:submitting", { detail: true })
			);
			try {
				const formData = getValues();
				// validation already done in MultiStepForm
				await checkout.updateEmail(formData.email);
				const result = await checkout.confirm();
				if (result.type === "error") {
					setError("payment", {
						type: "manual",
						message: result.error?.message || "Payment error",
					});
				}
			} catch (err) {
				setError("payment", {
					type: "manual",
					message: err?.message || "Payment error",
				});
			} finally {
				window.dispatchEvent(
					new CustomEvent("donation:submitting", { detail: false })
				);
			}
		}

		window.addEventListener("donation:confirmPayment", handleConfirm);
		return () =>
			window.removeEventListener("donation:confirmPayment", handleConfirm);
	}, [checkout, getValues, setError]);

	return (
		<PaymentElement
			onFocus={() => window.dispatchEvent(new Event("donation:showButton"))}
		/>
	);
}
