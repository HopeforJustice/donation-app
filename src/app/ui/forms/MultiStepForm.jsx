"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { formSchema } from "@/app/lib/schema";
import { steps as initialSteps } from "@/app/lib/steps";
import Step from "./Step";
import Button from "../buttons/Button";
import ProgressIndicator from "./ProgressIndicator";
import HorizontalRule from "@/app/ui/HorizontalRule";
import {
	extractDefaultValues,
	getAcceptedCurrencies,
	updateStepsWithParams,
	updateStepsBasedOnSelections,
	getFieldIdsExcludingRemoved,
} from "@/app/lib/utilities";

const MultiStepForm = () => {
	const searchParams = useSearchParams();
	const { defaultValues, initialCurrency, amountProvided } =
		extractDefaultValues(initialSteps, searchParams);
	const acceptedCurrencies = getAcceptedCurrencies(initialSteps);
	const isCurrencyAccepted = acceptedCurrencies.some(
		(currency) => currency.value === initialCurrency
	);

	const [step, setStep] = useState(0);
	const [showGivingDetails, setShowAmountField] = useState(!amountProvided);

	const methods = useForm({
		resolver: zodResolver(formSchema),
		mode: "onTouched",
		defaultValues,
	});

	const {
		trigger,
		handleSubmit,
		getValues,
		formState: { errors },
		watch,
	} = methods;

	const [steps, setSteps] = useState(() => {
		let updatedSteps = updateStepsWithParams(initialSteps, searchParams);
		const currency = searchParams.get("currency") || initialCurrency;
		const givingFrequency =
			searchParams.get("givingFrequency") || defaultValues.givingFrequency;
		return updateStepsBasedOnSelections(
			updatedSteps,
			currency,
			givingFrequency
		);
	});

	// Watch currency and givingFrequency and update steps
	useEffect(() => {
		const subscription = watch((value) => {
			const currency = value.currency || initialCurrency;
			const givingFrequency =
				value.givingFrequency || defaultValues.givingFrequency;

			setSteps((currentSteps) => {
				const updatedSteps = updateStepsBasedOnSelections(
					currentSteps,
					currency,
					givingFrequency
				);
				return updatedSteps;
			});
		});

		return () => subscription.unsubscribe();
	}, [watch, initialCurrency, defaultValues.givingFrequency]);

	//next step
	const nextStep = async () => {
		const fields = getFieldIdsExcludingRemoved(steps[step].fields);
		const valid = await trigger(fields, { shouldFocus: true });
		console.log(valid, errors);

		if (valid) {
			const stepData = getValues(fields);
			console.log(`Data from step ${step + 1}:`, stepData);

			setSteps((prevSteps) =>
				prevSteps.map((s, index) => {
					if (index === step) {
						return { ...s, status: "complete" };
					} else if (index === step + 1) {
						return { ...s, status: "current" };
					}
					return s;
				})
			);

			setStep(step + 1);
		}
	};

	//prev step
	const prevStep = () => {
		setSteps((prevSteps) =>
			prevSteps.map((s, index) => {
				if (index === step - 1) {
					return { ...s, status: "current" };
				} else if (index === step) {
					return { ...s, status: "upcoming" };
				}
				return s;
			})
		);

		setStep(step - 1);
	};

	//submit event
	const onSubmit = (data) => console.log(data);

	const showGivingDetailsHandler = () => setShowAmountField(true);

	if (!isCurrencyAccepted) {
		return <div>The currency set is not currently accepted</div>;
	}

	return (
		<div className="">
			<ProgressIndicator steps={steps} />
			<FormProvider {...methods}>
				<form onSubmit={handleSubmit(onSubmit)}>
					<Step
						stepData={steps[step]}
						watch={watch}
						showGivingDetails={showGivingDetails}
						onShowGivingDetails={showGivingDetailsHandler}
					/>
				</form>
			</FormProvider>
			<HorizontalRule className="my-8" />
			<div className="mt-4 flex justify-between">
				{step > 0 && (
					<Button
						onClick={prevStep}
						text="Previous"
						buttonType="secondary"
						size="extraLarge"
					/>
				)}
				{step !== steps.length - 1 ? (
					<Button
						onClick={nextStep}
						text="Next step"
						size="extraLarge"
						extraClasses="ml-auto"
					/>
				) : (
					<Button
						onClick={onSubmit}
						text="Submit"
						size="extraLarge"
						extraClasses="ml-auto"
					/>
				)}
			</div>
		</div>
	);
};

export default MultiStepForm;
