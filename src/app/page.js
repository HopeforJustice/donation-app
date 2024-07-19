import Image from "next/image";
import FormContainer from "./ui/forms/FormContainer";
import MultiStepForm from "./ui/forms/MultiStepForm";
import Grid from "./ui/layout/Grid";
import Container from "./ui/layout/containers/Container";

export default function Home() {
	return (
		<main>
			<Grid cols="1" rows="1" className="min-h-full realtive">
				<div className="z-10 p-3">
					<Image
						src="/logo.svg"
						width={227}
						height={67.9}
						className="w-48 md:w-56"
					/>
				</div>
				<Image
					src="/donation-img.jpg"
					layout="fill"
					alt="Picture of Hope for Justice client"
					className="object-cover z-0 hidden md:block"
				/>
				<Container className="mt-6">
					<Grid cols="12" className="bg-red-50">
						<div className="rounded-lg p-8 md:p-12 sm:ring-1 ring-gray-300 ring-inset col-span-12 md:col-span-9 lg:col-span-6 lg:max-w-xl xl:col-start-2 bg-white z-10">
							<MultiStepForm />
						</div>
					</Grid>
				</Container>
			</Grid>
		</main>
	);
}
