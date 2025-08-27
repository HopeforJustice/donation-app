"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import TickIcon from "../ui/icons/TickIcon";
import CrossIcon from "../ui/icons/CrossIcon";
import FacebookIcon from "../ui/icons/FacebookIcon";
import InstagramIcon from "../ui/icons/InstagramIcon";
import XIcon from "../ui/icons/XIcon";
import Container from "../ui/layout/containers/Container";
import LinkedInIcon from "../ui/icons/LinkedInIcon";
import Image from "next/image";
import HorizontalRule from "../ui/HorizontalRule";

const Loading = () => <p>Loading...</p>;

const SuccessPageContent = () => {
	const searchParams = useSearchParams();
	const name = searchParams.get("name");
	const frequency = searchParams.get("frequency");
	const gateway = searchParams.get("gateway");
	const sessionId = searchParams.get("session_id");

	const [paymentStatus, setPaymentStatus] = useState(null);
	const [loading, setLoading] = useState(!!sessionId); // Only load if we have a session_id

	useEffect(() => {
		async function checkStripePaymentStatus() {
			if (!sessionId) {
				setLoading(false);
				return; // Not a Stripe payment
			}

			try {
				const response = await fetch(
					`/api/checkPaymentStatus?session_id=${sessionId}`
				);
				const status = await response.json();
				setPaymentStatus(status);
			} catch (error) {
				console.error("Error checking payment status:", error);
				setPaymentStatus({ error: error.message });
			} finally {
				setLoading(false);
			}
		}

		checkStripePaymentStatus();
	}, [sessionId]);

	// Determine the message to show based on payment status
	const getPaymentMessage = () => {
		// Handle Stripe payments
		if (sessionId && paymentStatus) {
			if (paymentStatus.error) {
				return "There was an issue verifying your payment. Please <a href='https://hopeforjustice.org/contact'>contact us if you have concerns.</a>";
			}

			if (paymentStatus.isSuccessful) {
				return "Your donation was successfully processed, you should receive a receipt shortly.";
			} else if (paymentStatus.isPending) {
				return "Your payment is being processed. You should receive a receipt once completed.";
			} else {
				return "Your payment requires additional verification. Please check your email or contact your bank.";
			}
		}

		// Handle GoCardless and other gateways
		if (frequency === "monthly" && gateway === "gocardless") {
			return "Your direct debit was successfully processed, you should receive a confirmation email from GoCardless shortly.";
		}

		// Default message for other payment methods
		return "Your donation was successfully processed, you should receive a receipt shortly.";
	};

	// Determine the heading to show based on payment status
	const getHeading = () => {
		// Handle Stripe payments with errors
		if (
			sessionId &&
			paymentStatus &&
			(paymentStatus.error ||
				(!paymentStatus.isSuccessful && !paymentStatus.isPending))
		) {
			return "Payment Error";
		}

		// Default thank you for successful or pending payments
		return `Thank you ${name ? name : ""}`;
	};

	return (
		<main className="md:bg-slate-50">
			{/* logos */}
			<a href="https://hopeforjustice.org" className="z-10 p-3 fixed">
				<Image
					src="/logo.svg"
					width={227}
					height={67.9}
					className="block xl:hidden w-48 md:w-56"
					alt="Hope for Justice logo"
				/>
				<Image
					src="/logo.svg"
					width={227}
					height={67.9}
					className="hidden xl:block fixed"
					alt="Hope for Justice logo"
				/>
			</a>
			{/* / logos */}

			<Container className="min-h-[100vh] flex justify-center items-start pt-20 md:pt-0 md:items-center">
				{/* thank you box container */}
				<div className="w-full max-w-[620px] mx-auto bg-white md:ring-1 md:ring-slate-100 p-10 xl:p-20 rounded-lg text-center space-y-6 md:space-y-8">
					{loading ? (
						<h1 className="text-2xl text-hfj-black">
							<span className="capitalize font-bold">
								Processing Payment...
							</span>
						</h1>
					) : (
						<>
							<div className="w-10 h-10 md:w-16 md:h-16 mx-auto">
								{sessionId &&
								paymentStatus &&
								(paymentStatus.error ||
									(!paymentStatus.isSuccessful && !paymentStatus.isPending)) ? (
									<CrossIcon />
								) : (
									<TickIcon />
								)}
							</div>
							<h1 className="text-4xl md:text-5xl font-display text-hfj-black">
								<span className="capitalize">{getHeading()}</span>
							</h1>
							<p
								className={`xl:text-lg [&>a]:underline [&>a]:hover:no-underline ${
									sessionId &&
									paymentStatus &&
									(paymentStatus.error ||
										(!paymentStatus.isSuccessful && !paymentStatus.isPending))
										? "text-red-600"
										: "text-hfj-black"
								}`}
								dangerouslySetInnerHTML={{ __html: getPaymentMessage() }}
							></p>

							{sessionId &&
							paymentStatus &&
							(paymentStatus.error ||
								(!paymentStatus.isSuccessful && !paymentStatus.isPending)) ? (
								""
							) : (
								<>
									<p className="mt-3 text-sm">
										Support us further by following us on social media
									</p>
									<div className="flex justify-center gap-6 items-center">
										<FacebookIcon />
										<InstagramIcon />
										<XIcon />
										<LinkedInIcon />
									</div>
								</>
							)}
							<div className="pt-5">
								<HorizontalRule />
							</div>
						</>
					)}
				</div>

				{/* / thank you box container */}
			</Container>
		</main>
	);
};

const SuccessPage = () => (
	<Suspense fallback={<Loading />}>
		<SuccessPageContent />
	</Suspense>
);

export default SuccessPage;
