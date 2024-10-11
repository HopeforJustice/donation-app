import { getGoCardlessClient } from "@/app/lib/gocardless/gocardlessclient";

const client = getGoCardlessClient();

export async function handlePaymentPaidOut(event) {
	const payoutId = event.links.payout;
	const payout = await client.payouts.find(payoutId);
	console.log(payout);
	return { message: "Payment Found", status: 200 };
}
