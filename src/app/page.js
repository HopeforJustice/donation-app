import Image from "next/image";
import MultiStepForm from "./ui/forms/MultiStepForm";
import Grid from "./ui/layout/Grid";
import Container from "./ui/layout/containers/Container";
import { Suspense } from "react";

export default function Home() {
	return (
		<main>
			<Grid cols="1" rows="1" className="min-h-full realtive">
				{/* logo */}
				<div className="z-10 p-3 xl:hidden">
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
				<div className="fixed h-full w-full z-0 hidden md:block xl:w-1/2 xl:right-0 bg-hfj-black">
					<Image
						src="/donation-img.jpg"
						layout="fill"
						alt="Picture of Hope for Justice client small"
						className="object-cover xl:hidden"
					/>
					<Image
						src="/donation-img-centered.jpg"
						layout="fill"
						alt="Picture of Hope for Justice client"
						className="object-cover hidden xl:block xl:!h-[90%]"
					/>
					<div className="absolute bottom-[10%] w-full h-1/4 bg-gradient-to-t from-hfj-black to-transparent hidden xl:block"></div>
				</div>

				<Container className="my-6 mb-10 xl:max-w-none xl:px-0 xl:m-0">
					<Grid cols="12" className="">
						<div className="rounded-lg p-8 xl:p-3 md:p-12 sm:ring-1 ring-gray-300 ring-inset col-span-12 md:col-span-9 lg:max-w-xl xl:col-span-6 xl:max-w-none xl:min-h-[100vh] xl:ring-0 bg-white z-10">
							<Image
								src="/logo.svg"
								width={227}
								height={67.9}
								className="hidden xl:block"
								alt="Hope for Justice logo"
							/>
							<div className="xl:max-w-lg xl:mx-auto xl:mt-[70px] xl:mb-10">
								<Suspense>
									<MultiStepForm />
								</Suspense>
							</div>
						</div>
						<h1 className="font-display text-white text-6xl hidden xl:block col-span-4 z-10 fixed bottom-10 left-1/2 ml-16 max-w-xl">
							Bring freedom from modern slavery
						</h1>
					</Grid>
				</Container>
			</Grid>
		</main>
	);
}
