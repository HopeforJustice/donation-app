"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { formSchema } from "@/app/lib/schema";
import Step from "./Step";
import Button from "../buttons/Button";
import ProgressIndicator from "./ProgressIndicator";
import HorizontalRule from "@/app/ui/HorizontalRule";
import { getFieldIdsExcludingRemoved } from "@/app/lib/utilities";
import { extractDefaultValues } from "@/app/lib/utilities";
import { generateSteps } from "@/app/lib/steps/generateSteps";
import { stepTemplates } from "@/app/lib/steps/stepTemplates";
import { getPreferences } from "@/app/lib/utilities";
import { extractPreferences } from "@/app/lib/utilities";

const MultiStepForm = ({
	currency = "gbp",
	frequency = "monthly",
	setCurrency,
	setAmount,
	setGivingFrequency,
}) => {
	const searchParams = useSearchParams();
	const validate = searchParams.get("validate") || true;
	const [submissionError, setSubmissionError] = useState(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [step, setStep] = useState(0);

	// const paymentGateway = searchParams.get("paymentGateway") || "gocardless";
	// const stripeMode = searchParams.get("stripeMode") || "live";
	// const projectId = searchParams.get("projectId") || null;
	// const givingTo = searchParams.get("givingTo") || null;
	// const donorType = searchParams.get("donorType") || null;
	// const organisationName = searchParams.get("organisationName") || null;

	const supportedCurrencies = ["usd", "gbp", "nok", "aud"];
	const isCurrencyAccepted = supportedCurrencies.includes(currency);
	const { defaultValues, initialCurrency, amountProvided } =
		extractDefaultValues(stepTemplates, searchParams);
	function regenerateSteps({ currency, frequency }) {
		return generateSteps({ currency, frequency });
	}
	const methods = useForm({
		resolver: zodResolver(formSchema),
		mode: "onChange",
		delayError: 1500,
		defaultValues,
	});

	const {
		trigger,
		handleSubmit,
		getValues,
		formState: { errors },
		watch,
		setValue,
	} = methods;

	const formData = getValues();

	const watchedCurrency = watch("currency") || defaultValues.currency;
	const watchedFrequency =
		watch("givingFrequency") || defaultValues.givingFrequency;
	const watchedAmount = watch("amount") || null;

	const [steps, setSteps] = useState(() =>
		regenerateSteps({ currency: watchedCurrency, frequency: watchedFrequency })
	);

	function updateStepDescription(stepId, newDescription) {
		setSteps((prevSteps) =>
			prevSteps.map((step) =>
				step.id === stepId ? { ...step, description: newDescription } : step
			)
		);
	}

	const [showGivingDetails, setShowAmountField] = useState(!amountProvided);

	useEffect(() => {
		setSteps(
			generateSteps({ currency: watchedCurrency, frequency: watchedFrequency })
		);
		setCurrency(watchedCurrency);
		setGivingFrequency(watchedFrequency);
		setAmount(watchedAmount);
	}, [
		watchedCurrency,
		watchedFrequency,
		watchedAmount,
		setCurrency,
		setGivingFrequency,
		setAmount,
	]);

	const nextStep = async () => {
		setIsLoading(true);
		if (validate === "false") {
			setStep((s) => s + 1);
			setIsLoading(false);
			return;
		}
		const fields = getFieldIdsExcludingRemoved(steps[step].fields);
		const valid = await trigger(fields, { shouldFocus: true });
		if (valid) {
			if (step === 0 && formData.currency === "gbp") {
				const getPreferencesData = await getPreferences(formData.email);
				console.log(getPreferencesData);
				if (getPreferencesData.preferences) {
					const extractedPreferences = await extractPreferences(
						getPreferencesData
					);

					if (extractedPreferences) {
						const preferenceFields = [
							"emailPreference",
							"postPreference",
							"smsPreference",
							"phonePreference",
						];

						for (const field of preferenceFields) {
							const value = extractedPreferences[field];
							if (value !== undefined) {
								setValue(field, String(value));
							}
						}

						updateStepDescription(
							"preferences",
							`These are the preferences we hold for ${formData.email} for how we can contact you about the work of Hope for Justice and how your support is making a difference:`
						);
					}
				}
			}
			setStep((s) => s + 1);
		}
		setIsLoading(false);
	};

	const prevStep = () => setStep((s) => s - 1);

	// On Submit
	const onSubmit = async () => {
		const valid = await trigger();

		if (!valid) return;

		setIsSubmitting(true);

		try {
			let response;

			// Handle GoCardless
			if (
				formData.currency === "gbp" &&
				formData.givingFrequency === "monthly"
			) {
				response = await fetch("/api/processDirectDebit", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify(formData),
				});

				const data = await response.json();

				if (!response.ok) {
					throw new Error(data.message || "GoCardless submission failed.");
				}

				if (data.response.authorisationUrl) {
					window.location.href = data.response.authorisationUrl;
				}
			}
		} catch (error) {
			console.error("Error submitting data:", error);
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
		} finally {
			setIsSubmitting(false);
		}
	};

	//function to show giving details passed to step component
	const showGivingDetailsHandler = () => setShowAmountField(true);

	if (!isCurrencyAccepted) {
		return <div>Error: The currency set is not currently accepted.</div>;
	}

	return (
		<div className="">
			<ProgressIndicator steps={steps} currentStep={step} />
			<FormProvider {...methods}>
				<form onSubmit={handleSubmit(onSubmit)}>
					<Step
						stepData={steps[step]}
						watch={watch}
						currency={currency}
						frequency={frequency}
						showGivingDetails={showGivingDetails}
						onShowGivingDetails={showGivingDetailsHandler}
					/>
					{step === steps.length - 1 &&
						Object.keys(errors).length > 0 &&
						submissionError === null && (
							<p className="text-hfj-red text-sm">
								Something went wrong. Please check your submission.
								{Object.entries(errors).map(([key, value]) => (
									<span key={key} className="block">
										{value.message}
									</span>
								))}
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
				{step < steps.length - 1 && (
					<Button
						onClick={nextStep}
						text={isLoading ? "Loading..." : "Next Step"}
						size="extraLarge"
						extraClasses="ml-auto"
					/>
				)}

				{step === steps.length - 1 &&
					formData.currency === "gbp" &&
					formData.givingFrequency === "monthly" && (
						<Button
							onClick={onSubmit}
							text={isSubmitting ? "Submitting..." : "Setup Direct Debit"}
							size="extraLarge"
							extraClasses="ml-auto"
							disabled={isSubmitting}
						/>
					)}

				{/* submit logic for stripe element lives in the stripe payment element component */}
				{/* {step === steps.length - 1 &&
					(formData.currency !== "gbp" ||
						formData.givingFrequency !== "monthly") && (
						<Button
							onClick={onSubmit}
							text={isSubmitting ? "Submitting..." : `Donate`}
							size="extraLarge"
							extraClasses="ml-auto"
							disabled={isSubmitting}
						/>
					)} */}
			</div>
		</div>
	);
};

export default MultiStepForm;
