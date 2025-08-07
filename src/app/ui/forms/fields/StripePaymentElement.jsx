import { PaymentElement } from "@stripe/react-stripe-js";
import { useCheckout } from "@stripe/react-stripe-js";

export default function StripePaymentElement() {
	const checkout = useCheckout();
	return (
		<div>
			<PaymentElement />
			<div>paying {checkout.total.total.amount}</div>
		</div>
	);
}
