"use client";

import { useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { formSchema } from "@/app/lib/schema";
import { steps as initialSteps } from "@/app/lib/steps";
import StepOne from "./StepOne";
import Button from "../buttons/Button";
import ProgressIndicator from "./ProgressIndicator";

const MultiStepForm = () => {
	const [step, setStep] = useState(0);
	const [steps, setSteps] = useState(initialSteps);

	const methods = useForm({
		resolver: zodResolver(formSchema),
		mode: "onTouched",
	});
	const {
		trigger,
		handleSubmit,
		getValues,
		formState: { errors },
	} = methods;

	// Submit function
	const onSubmit = (data) => console.log(data);

	// Function to go to the next step
	const nextStep = async () => {
		const fields = steps[step].fields;
		const valid = await trigger(fields, { shouldFocus: true });
		console.log(valid, errors);

		if (valid) {
			const stepData = getValues(fields);
			console.log(`Data from step ${step + 1}:`, stepData);

			const updatedSteps = steps.map((s, index) => {
				if (index === step) {
					return { ...s, status: "complete" };
				} else if (index === step + 1) {
					return { ...s, status: "current" };
				}
				return s;
			});

			setSteps(updatedSteps);
			setStep(step + 1);
		}
	};

	// Function to go to the previous step
	const prevStep = () => {
		const updatedSteps = steps.map((s, index) => {
			if (index === step - 1) {
				return { ...s, status: "current" };
			} else if (index === step) {
				return { ...s, status: "upcoming" };
			}
			return s;
		});

		setSteps(updatedSteps);
		setStep(step - 1);
	};

	return (
		<div className="">
			<ProgressIndicator steps={steps} />
			<FormProvider {...methods}>
				<form onSubmit={handleSubmit(onSubmit)}>
					{step === 0 && <StepOne title={steps[step].title} />}
					{step === 1 && <div>Step 2</div>}
					{step === 2 && <div>Step 3</div>}
				</form>
			</FormProvider>
			<div className="mt-4 flex justify-between">
				{step > 0 && (
					<Button
						onClick={prevStep}
						text="Previous"
						buttonType="secondary"
						size="large"
					/>
				)}
				<Button
					onClick={nextStep}
					text="Next step"
					size="large"
					extraClasses="ml-auto"
				/>
			</div>
		</div>
	);
};

export default MultiStepForm;
