"use client";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { useState, useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { useSearchParams } from "next/navigation";

const PayPalPaymentStep = ({ amount, currency }) => {
	const [clientId, setClientId] = useState(null);
	const [isLoading, setIsLoading] = useState(true);
	const [selected, setSelected] = useState(false);
	const { getValues, setError } = useFormContext();
	const searchParams = useSearchParams();

	useEffect(() => {
		// Determine environment and region
		const isProduction = process.env.NEXT_PUBLIC_VERCEL_ENV === "production";
		const environment = isProduction ? "LIVE" : "SANDBOX";
		const region = currency.toLowerCase() === "gbp" ? "UK" : "US";

		console.log("PayPal config:", {
			currency,
			environment,
			region,
			isProduction,
		});

		// Get the appropriate client ID - use direct access since dynamic keys don't work reliably
		let selectedClientId;

		if (region === "US" && environment === "SANDBOX") {
			selectedClientId = process.env.NEXT_PUBLIC_PAYPAL_US_SANDBOX_CLIENT_ID;
		} else if (region === "US" && environment === "LIVE") {
			selectedClientId = process.env.NEXT_PUBLIC_PAYPAL_US_LIVE_CLIENT_ID;
		} else if (region === "UK" && environment === "SANDBOX") {
			selectedClientId = process.env.NEXT_PUBLIC_PAYPAL_UK_SANDBOX_CLIENT_ID;
		} else if (region === "UK" && environment === "LIVE") {
			selectedClientId = process.env.NEXT_PUBLIC_PAYPAL_UK_LIVE_CLIENT_ID;
		}

		console.log(
			"Selected PayPal client ID:",
			selectedClientId ? "found" : "not found"
		);
		console.log("Using region:", region, "environment:", environment);

		if (selectedClientId) {
			setClientId(selectedClientId);
			setIsLoading(false);
		} else {
			console.error(`PayPal client ID not found for ${region} ${environment}`);
			setIsLoading(false);
		}
	}, [currency]);

	const createOrder = async () => {
		try {
			const formData = getValues();
			const response = await fetch("/api/createPayPalOrder", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					amount,
					currency,
					formData,
				}),
			});

			const data = await response.json();
			if (!response.ok) {
				throw new Error(data.error || "Failed to create PayPal order");
			}

			return data.orderID;
		} catch (error) {
			console.error("Error creating PayPal order:", error);
			setError("payment", {
				type: "manual",
				message: error.message || "Failed to create PayPal order",
			});
			throw error;
		}
	};

	const onApprove = async (data) => {
		try {
			window.dispatchEvent(
				new CustomEvent("donation:submitting", { detail: true })
			);

			const formData = getValues();
			const response = await fetch("/api/capturePayPalOrder", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					orderID: data.orderID,
					formData,
				}),
			});

			const result = await response.json();
			if (!response.ok) {
				throw new Error(result.error || "Payment capture failed");
			}

			// Redirect to success page
			window.location.href = `/success?paypal_order_id=${data.orderID}`;
		} catch (error) {
			console.error("Error capturing PayPal payment:", error);
			setError("payment", {
				type: "manual",
				message: error.message || "Payment capture failed",
			});
			window.dispatchEvent(
				new CustomEvent("donation:submitting", { detail: false })
			);
		}
	};

	const onError = (error) => {
		console.error("PayPal payment error:", error);
		setError("payment", {
			type: "manual",
			message: "PayPal payment failed. Please try again.",
		});
	};

	if (isLoading) {
		return (
			<div className="flex flex-col gap-4">
				<div className="w-full h-12 rounded-lg animate-pulse bg-gray-200"></div>
				<div className="w-full h-12 rounded-lg animate-pulse bg-gray-200"></div>
			</div>
		);
	}

	if (!clientId) {
		return (
			<div className="text-red-600 p-4 border border-red-200 rounded-lg">
				PayPal is currently unavailable. Please try using a card payment
				instead.
			</div>
		);
	}

	const paypalOptions = {
		"client-id": clientId,
		currency: currency.toUpperCase(),
		intent: "capture",
		"disable-funding": "credit,card,paylater",
		"enable-funding": "venmo",
		components: "buttons",
	};

	console.log("PayPal SDK options:", paypalOptions);

	return (
		<div className="mt-2" onClick={() => setSelected(true)}>
			<PayPalScriptProvider options={paypalOptions}>
				<div
					className={
						selected
							? "w-full ring-1 ring-[#e6e6e6] rounded-[5px] p-4 mb-5 shadow-[rgba(0, 0, 0, 0.03) 0px 1px 1px 0px, rgba(0, 0, 0, 0.02) 0px 3px 6px 0px]"
							: "w-full ring-1 ring-[#e6e6e6] rounded-[5px] p-4 mb-5 shadow-[rgba(0, 0, 0, 0.03) 0px 1px 1px 0px, rgba(0, 0, 0, 0.02) 0px 3px 6px 0px] hover:cursor-pointer"
					}
				>
					<div className="flex items-center">
						<div className="w-[31.5px] mr-[10.5px]">
							<svg
								id="Group_7496"
								data-name="Group 7496"
								xmlns="http://www.w3.org/2000/svg"
								width="14.787"
								height="17.376"
								viewBox="0 0 14.787 17.376"
							>
								<path
									id="Path_17129"
									data-name="Path 17129"
									d="M94.433,54.863l.3-1.913-.673-.016H90.845L93.08,38.82a.186.186,0,0,1,.062-.111.183.183,0,0,1,.119-.044h5.423c1.8,0,3.043.373,3.691,1.11a2.528,2.528,0,0,1,.592,1.1,3.965,3.965,0,0,1,0,1.522l-.007.044v.389l.3.172a2.135,2.135,0,0,1,.616.468,2.172,2.172,0,0,1,.5,1.116,4.711,4.711,0,0,1-.071,1.619,5.7,5.7,0,0,1-.666,1.833,3.777,3.777,0,0,1-1.055,1.152,4.291,4.291,0,0,1-1.421.639,7.123,7.123,0,0,1-1.776.2h-.422A1.268,1.268,0,0,0,97.718,51.1l-.032.172-.534,3.371-.024.124a.106.106,0,0,1-.033.072.09.09,0,0,1-.056.02Z"
									transform="translate(-90.232 -38.077)"
									fill="#253b80"
								/>
								<path
									id="Path_17130"
									data-name="Path 17130"
									d="M110.514,51.521q-.024.155-.056.317c-.715,3.657-3.162,4.92-6.287,4.92h-1.591a.772.772,0,0,0-.764.652L101,62.555l-.231,1.458a.406.406,0,0,0,.4.469H104a.678.678,0,0,0,.67-.57l.028-.143.531-3.358.034-.184a.677.677,0,0,1,.67-.571h.422c2.734,0,4.875-1.106,5.5-4.3a3.654,3.654,0,0,0-.566-3.237A2.7,2.7,0,0,0,110.514,51.521Z"
									transform="translate(-97.189 -47.107)"
									fill="#179bd7"
								/>
								<path
									id="Path_17131"
									data-name="Path 17131"
									d="M112.23,49.92q-.164-.047-.338-.086t-.358-.067a8.872,8.872,0,0,0-1.4-.1h-4.251a.677.677,0,0,0-.67.571l-.9,5.7-.026.166a.772.772,0,0,1,.764-.652h1.591c3.125,0,5.572-1.264,6.287-4.92.021-.108.039-.214.056-.317a3.83,3.83,0,0,0-.588-.247C112.338,49.953,112.284,49.936,112.23,49.92Z"
									transform="translate(-99.653 -45.803)"
									fill="#222d65"
								/>
								<path
									id="Path_17132"
									data-name="Path 17132"
									d="M94.35,41.119a.678.678,0,0,1,.67-.571h4.251a8.864,8.864,0,0,1,1.4.1q.184.029.358.067t.338.086l.16.05a3.874,3.874,0,0,1,.588.247,3.442,3.442,0,0,0-.735-3.1c-.809-.917-2.269-1.31-4.137-1.31H91.822a.774.774,0,0,0-.766.652L88.8,51.6a.465.465,0,0,0,.459.537h3.348l.841-5.312Z"
									transform="translate(-88.792 -36.686)"
									fill="#253b80"
								/>
							</svg>
						</div>

						<p className='text-[#6d6e78] font-[-apple-system,"system-ui",sans-serif] font-semibold text-sm'>
							PayPal
						</p>
					</div>
					{selected && (
						<div className="">
							<p className="opacity-80 mb-2 mt-4">
								To donate via paypal click the button below:
							</p>
							<PayPalButtons
								style={{
									layout: "horizontal",
									color: "blue",
									shape: "rect",
									label: "paypal",
									height: 40,
									tagline: false,
								}}
								createOrder={createOrder}
								onApprove={onApprove}
								onError={onError}
								onCancel={() => {
									console.log("PayPal payment cancelled");
								}}
							/>
						</div>
					)}
				</div>
			</PayPalScriptProvider>
		</div>
	);
};

export default PayPalPaymentStep;
