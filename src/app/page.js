"use client";
import Image from "next/image";
import MultiStepForm from "./ui/forms/MultiStepForm";
import Grid from "./ui/layout/Grid";
import Container from "./ui/layout/containers/Container";
import { Suspense, useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import GivingSummary from "./ui/forms/GivingSummary";

export default function Home() {
	const searchParams = useSearchParams();
	const [currency, setCurrency] = useState(
		searchParams.get("currency") || "gbp"
	);
	const [amount, setAmount] = useState(searchParams.get("amount") || null);
	const [givingFrequency, setGivingFrequency] = useState(
		searchParams.get("givingFrequency") || "monthly"
	);
	const [giftAid, setGiftAid] = useState(false);
	const [lastStep, setLastStep] = useState(false);

	const frequency = searchParams.get("frequency") || "monthly";

	const image = searchParams.get("image") || null;

	// Decode the image URL if it exists
	const decodedImage = useMemo(() => {
		if (!image) return null;
		try {
			return decodeURIComponent(image);
		} catch (error) {
			console.error("Error decoding image URL:", error);
			return null;
		}
	}, [image]);

	const [desktopSize, setDesktopSize] = useState(
		typeof window !== "undefined" ? window.innerWidth > 1279 : false
	);

	//look for param to restrict payment methods
	const allowedPaymentMethods = useMemo(() => {
		const param = searchParams.get("allowedPaymentMethods");
		if (!param) return [];
		return param.split(",").map((method) => method.trim());
	}, [searchParams]);

	useEffect(() => {
		function handleResize() {
			setDesktopSize(window.innerWidth > 1279);
		}

		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, []);

	return (
		<main className="xl:bg-[#fafafa]">
			<Grid
				cols="12"
				rows="1"
				className="min-h-full max-w-[1920px] min-[1921px]:mx-auto realtive xl:bg-white"
			>
				{/* logo */}
				<div className="z-10 p-3 xl:hidden col-span-12">
					<Image
						src="/logo-white-text.svg"
						width={227}
						height={67.9}
						className="hidden md:block w-48 md:w-56"
						alt="Hope for Justice logo small"
					/>
					<Image
						src="/logo.svg"
						width={227}
						height={67.9}
						className="block md:hidden w-48 md:w-56"
						alt="Hope for Justice logo"
					/>
				</div>

				{/* background image */}
				<div className="fixed h-full min-h-7 w-full z-20 hidden md:block xl:w-1/2 xl:right-0 bg-hfj-black min-[1921px]:relative min-[1921px]:col-start-7 min-[1921px]:col-end-13 min-[1921px]:w-full min-[1921px]:row-start-1 min-[1921px]:h-[80vh] min-[1921px]:self-center min-[1921px]:rounded-xl min-[1921px]:overflow-hidden min-[1921px]:-ml-10 min-[1921px]:z-30">
					<Image
						src={image ? decodedImage : "/donation-img.jpg"}
						layout="fill"
						alt="Campaign image"
						className="object-cover xl:hidden"
					/>
					<Image
						src={image ? decodedImage : "/donation-img-centered.jpg"}
						layout="fill"
						alt="Campaign image"
						className="object-cover hidden xl:block xl:!h-[90%]"
					/>
					<div className="absolute bottom-[10%] w-full h-1/4 bg-gradient-to-t from-hfj-black to-transparent hidden xl:block"></div>

					{!lastStep && (
						<>
							<h1 className="font-display text-white text-6xl hidden xl:block col-span-4 z-10 absolute bottom-10 w-full ml-16 max-w-xl">
								Bring freedom from{" "}
								{currency === "gbp" ? "modern slavery" : "human trafficking"}
							</h1>
						</>
					)}
					{lastStep && desktopSize && (
						<GivingSummary
							amount={amount}
							givingFrequency={givingFrequency}
							currency={currency}
							giftAid={giftAid}
						/>
					)}
				</div>

				<Container className="my-6 mb-10 col-span-12 xl:col-span-6 xl:max-w-none xl:px-0 xl:m-0">
					<div className="relative rounded-lg p-8 xl:p-3 md:p-12 sm:ring-1 ring-gray-300 ring-inset md:col-span-9 max-w-xl mx-auto xl:max-w-none xl:mx-0 xl:min-h-[100vh] xl:ring-0 bg-white z-10 xl:flex xl:flex-col xl:items-center justify-center">
						<Image
							src="/logo.svg"
							width={227}
							height={67.9}
							className="hidden xl:block xl:absolute xl:top-0 xl:left-0 xl:m-8 [@media(max-height:900px)]:hidden"
							alt="Hope for Justice logo"
						/>
						<div className="xl:max-w-lg xl:mx-auto xl:mt-[140px] xl:mb-10 xl:min-w-[32rem]">
							<Suspense>
								<MultiStepForm
									currency={currency}
									frequency={frequency}
									setCurrency={setCurrency}
									setAmount={setAmount}
									setGiftAid={setGiftAid}
									setGivingFrequency={setGivingFrequency}
									lastStep={lastStep}
									setLastStep={setLastStep}
									desktopSize={desktopSize}
									allowedPaymentMethods={allowedPaymentMethods}
								/>
							</Suspense>
						</div>
					</div>
				</Container>
			</Grid>
		</main>
	);
}
