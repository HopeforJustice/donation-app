// /app/api/test/route.js
import { NextResponse } from "next/server";
import { duplicateCheck } from "@/app/lib/donorfy/duplicateCheck";
import { addActiveTags } from "@/app/lib/donorfy/addActiveTags";
import storeWebhookEvent from "@/app/lib/webhooks/storeWebhookEvent";

export async function POST() {
	try {
		const event = {
			action: "fulfilled",
			created_at: "2024-10-11T14:35:42.062Z",
			details: {
				cause: "billing_request_fulfilled",
				description:
					"This billing request has been fulfilled, and the resources have been created.",
				origin: "api",
			},
			id: "EV01S7J0EGKEGR",
			links: {
				billing_request: "BRQ00078R5BR53G",
				customer: "CU0019NHJ9VJ3M",
				customer_bank_account: "BA0012YNFKQE56",
				mandate_request_mandate: "MD00132XJZG55V",
			},
			resource_type: "billing_requests",
		};

		const paymentGatewayId = 1;
		const notes =
			"Billing Request marked as fulfilled in DB. Subscription created in DB and GC. Tags added to constituent. Activity added.";
		await storeWebhookEvent(event, paymentGatewayId, notes);

		return NextResponse.json({ message: "success" }, { status: 200 });
	} catch (error) {
		console.error("Error in API:", error);
		return NextResponse.json(
			{ message: "Error processing request" },
			{ status: 500 }
		);
	}
}
