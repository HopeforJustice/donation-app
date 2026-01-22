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
		// NOK uses the same PayPal client as UK
		const region =
			currency.toLowerCase() === "gbp" || currency.toLowerCase() === "nok"
				? "UK"
				: "US";

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
			const projectId = searchParams.get("projectId") || "";
			const givingTo = searchParams.get("givingTo") || "";
			const donorType = searchParams.get("donorType") || "";
			const organisationName = searchParams.get("organisationName") || "";
			const expandedFormData = {
				...formData,
				projectId,
				givingTo,
				donorType,
				organisationName,
			};
			// Convert amount to standard number format (comma to period for Norwegian locale)
			const normalizedAmount =
				typeof formData.amount === "string"
					? formData.amount.replace(",", ".")
					: formData.amount;

			const response = await fetch("/api/createPayPalOrder", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					amount: normalizedAmount,
					currency,
					expandedFormData,
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
			const projectId = searchParams.get("projectId") || "";
			const givingTo = searchParams.get("givingTo") || "";
			const donorType = searchParams.get("donorType") || "";
			const organisationName = searchParams.get("organisationName") || "";
			const expandedFormData = {
				...formData,
				projectId,
				givingTo,
				donorType,
				organisationName,
			};

			const normalizedAmount =
				typeof formData.amount === "string"
					? formData.amount.replace(",", ".")
					: formData.amount;

			const response = await fetch("/api/capturePayPalOrder", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					orderID: data.orderID,
					formData: expandedFormData,
				}),
			});
			const result = await response.json();
			if (!response.ok) {
				throw new Error(result.error || "Payment capture failed");
			}

			// Redirect to success page
			window.location.href = `/success?paypal_order_id=${data.orderID}&currency=${formData.currency}&amount=${normalizedAmount}&gateway=paypal&frequency=${formData.givingFrequency}`;
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
						<div
							className={`w-[31.5px] ${
								currency === "gbp" ? "mr-[10.5px]" : ""
							}`}
						>
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
						{currency === "usd" && (
							<div className="w-[31.5px] mr-[10.5px]">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									xmlnsXlink="http://www.w3.org/1999/xlink"
									width="21"
									height="21"
									viewBox="0 0 21 21"
								>
									<defs>
										<clipPath id="clip-path">
											<rect
												id="Rectangle_3693"
												data-name="Rectangle 3693"
												width="21"
												height="21"
												rx="4"
												fill="none"
											/>
										</clipPath>
										<clipPath id="clip-path-2">
											<rect
												id="Rectangle_3694"
												data-name="Rectangle 3694"
												width="21"
												height="21"
												fill="none"
											/>
										</clipPath>
									</defs>
									<g
										id="Group_7695"
										data-name="Group 7695"
										transform="translate(0 0.168)"
									>
										<g
											id="Group_7692"
											data-name="Group 7692"
											transform="translate(0 -0.168)"
										>
											<g
												id="Group_7691"
												data-name="Group 7691"
												clipPath="url(#clip-path)"
											>
												<path
													id="Path_17240"
													data-name="Path 17240"
													d="M20.014,21.073H1.059A1.059,1.059,0,0,1,0,20.014V1.059A1.059,1.059,0,0,1,1.059,0H20.014a1.059,1.059,0,0,1,1.059,1.059V20.014a1.059,1.059,0,0,1-1.059,1.059"
													transform="translate(0 -0.073)"
													fill="#008cff"
												/>
											</g>
										</g>
										<g
											id="Group_7694"
											data-name="Group 7694"
											transform="translate(0 -0.168)"
										>
											<g
												id="Group_7693"
												data-name="Group 7693"
												clipPath="url(#clip-path-2)"
											>
												<path
													id="Path_17241"
													data-name="Path 17241"
													d="M271.145,230.756A4.1,4.1,0,0,1,271.74,233c0,2.8-2.4,6.433-4.343,8.986h-4.444l-1.782-10.619,3.891-.368.942,7.556c.88-1.429,1.967-3.675,1.967-5.207a4.179,4.179,0,0,0-.369-1.879Z"
													transform="translate(-255.667 -225.766)"
													fill="#fff"
												/>
											</g>
										</g>
									</g>
								</svg>
							</div>
						)}

						<p className='text-[#6d6e78] font-[-apple-system,"system-ui",sans-serif] font-semibold text-sm'>
							PayPal{currency === "usd" ? "/Venmo" : ""}
						</p>
					</div>
					{selected && (
						<div className="">
							<div className="mb-2 mt-4"></div>
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
							{currency === "usd" && (
								<p className="opacity-80 mb-2 mt-2 text-sm">
									If no Venmo option is present for you, no Venmo app has been
									detected on your device
								</p>
							)}
						</div>
					)}
				</div>
			</PayPalScriptProvider>
		</div>
	);
};

export default PayPalPaymentStep;
