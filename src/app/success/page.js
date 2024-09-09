// /app/success/page.js
"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

const SuccessPage = () => {
	const router = useRouter();

	useEffect(() => {
		const finalizeBillingRequest = async () => {
			const params = new URLSearchParams(window.location.search);
			const billingRequestFlowId = params.get("flow_id"); // Get the flow_id from the query parameters

			if (billingRequestFlowId) {
				try {
					const response = await fetch(`/api/gocardless/complete-flow`, {
						method: "POST",
						headers: {
							"Content-Type": "application/json",
						},
						body: JSON.stringify({ billingRequestFlowId }),
					});
					const data = await response.json();
					if (response.ok) {
						console.log("Billing Request fulfilled:", data);
					} else {
						console.error("Error completing flow:", data.message);
					}
				} catch (error) {
					console.error("Error:", error);
				}
			}
		};

		finalizeBillingRequest();
	}, [router]);

	return <div>Thank you for completing the Direct Debit setup!</div>;
};

export default SuccessPage;
