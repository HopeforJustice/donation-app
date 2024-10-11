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
	const [submissionError, setSubmissionError] = useState(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

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

	//submit
	const onSubmit = async () => {
		const valid = await trigger();

		if (valid) {
			const formData = getValues();
			setIsSubmitting(true);

			try {
				// Process Direct Debit via API
				const response = await fetch("/api/processDirectDebit", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify(formData),
				});

				const data = await response.json();

				// Check for error response
				if (!response.ok) {
					throw new Error(data.message || "Submission failed.");
				}

				// If successful, handle the success (e.g., redirect)
				if (data.response.authorisationUrl) {
					window.location.href = data.response.authorisationUrl; // Redirect to GoCardless
				}
			} catch (error) {
				setSubmissionError([
					"Error submitting. Please try again or get in touch at ",
					<a
						key="error"
						href="https://hopeforjustice.org/contact"
						className="underline"
					>
						hopeforjustice.org/contact
					</a>,
				]);
				console.error("Error submitting data:", error);
			} finally {
				setIsSubmitting(false);
			}
		}
	};

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
					{step === steps.length - 1 &&
						Object.keys(errors).length > 0 &&
						submissionError === null && (
							<p className="text-hfj-red text-sm">
								Something went wrong. Please check your submission.
							</p>
						)}
					{step === steps.length - 1 && submissionError && (
						<p className="text-hfj-red text-sm">{submissionError}</p>
					)}
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
						text={isSubmitting ? "Submitting..." : "Submit"}
						size="extraLarge"
						extraClasses="ml-auto"
						disabled={isSubmitting}
					/>
				)}
			</div>
		</div>
	);
};

export default MultiStepForm;
