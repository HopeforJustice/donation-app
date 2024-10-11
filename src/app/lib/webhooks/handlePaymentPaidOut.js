import { getGoCardlessClient } from "@/app/lib/gocardless/gocardlessclient";
import getCustomerFromPaymentGatewayCustomer from "../db/getCustomerFromPaymentGatewayCustomer";

const client = getGoCardlessClient();

export async function handlePaymentPaidOut(event) {
	//put this in a try catch
	const payoutId = event.links.payout;
	const paymentId = event.links.payment;
	const payout = await client.payouts.find(payoutId);
	const payment = await client.payments.find(paymentId);
	const fees = payout.deducted_fees;
	const amount = payment.amount;
	const mandate = await client.mandates.find(payment.links.mandate);
	const paymentGatewayCustomerId = mandate.links.customer;
	const customer = await getCustomerFromPaymentGatewayCustomer(
		paymentGatewayCustomerId
	);
	//if we cant find a customer in the db then this payout is from an RPI

	const constituentId = customer.rows[0].donorfy_constituent_id;
	const donorfyInstance = customer.rows[0].donorfy_instance;

	console.log(constituentId, donorfyInstance);
	//now create the payment in the db and the transaction in donorfy

	const donorfyFriendlyFees = fees / 100;
	const donorfyFriendlyAmount = amount / 100;

	//store the webhook event

	return { message: "Payment Found", status: 200 };
}
