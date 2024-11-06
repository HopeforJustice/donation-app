"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import TickIcon from "../ui/icons/TickIcon";
import FacebookIcon from "../ui/icons/FacebookIcon";
import InstagramIcon from "../ui/icons/InstagramIcon";
import XIcon from "../ui/icons/XIcon";
import Container from "../ui/layout/containers/Container";
import LinkedInIcon from "../ui/icons/LinkedInIcon";
import Image from "next/image";
import HorizontalRule from "../ui/HorizontalRule";

//too basic
const Loading = () => <p>Loading...</p>;

const SuccessPageContent = () => {
	const searchParams = useSearchParams();
	const name = searchParams.get("name");
	const frequency = searchParams.get("frequency");
	const gateway = searchParams.get("gateway");

	return (
		<main className="md:bg-slate-50">
			{/* logos */}
			<div className="z-10 p-3 fixed">
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
			</div>
			{/* / logos */}

			<Container className="min-h-[100vh] flex justify-center items-start pt-20 md:pt-0 md:items-center">
				{/* thank you box container */}
				<div className="max-w-[620px] mx-auto bg-white md:ring-1 md:ring-slate-100 p-10 xl:p-20 rounded-lg text-center space-y-6 md:space-y-8">
					<div className="w-10 h-10 md:w-16 md:h-16 mx-auto">
						<TickIcon />
					</div>
					<h1 className="text-4xl md:text-5xl font-display text-hfj-black">
						Thank you <span className="capitalize">{name}</span>
					</h1>
					<p className="text-hfj-black xl:text-lg">
						{frequency === "monthly" && gateway === "gocardless"
							? "Your direct debit was successfully processed, you should receive a confirmation email from GoCardless shortly."
							: "Your donation was successfully processed, you should receive a receipt shortly."}
					</p>

					<p className="mt-3 text-sm">
						Support us further by following us on social media
					</p>
					{/* socials */}
					<div className="flex justify-center gap-6 items-center">
						<FacebookIcon />
						<InstagramIcon />
						<XIcon />
						<LinkedInIcon />
					</div>
					<div className="pt-5">
						<HorizontalRule />
					</div>
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
