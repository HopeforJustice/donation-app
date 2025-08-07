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
	updateStepsWithParams,
	updateStepsBasedOnSelections,
	getFieldIdsExcludingRemoved,
	extractPreferences,
} from "@/app/lib/utilities";
import { getStripePromise } from "@/app/lib/stripe/getStripePromise";

const MultiStepForm = ({ onCurrencyChange }) => {
	const searchParams = useSearchParams();
	const { defaultValues, initialCurrency, amountProvided } =
		extractDefaultValues(initialSteps, searchParams);
	const [submissionError, setSubmissionError] = useState(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [step, setStep] = useState(0);
	const [showGivingDetails, setShowAmountField] = useState(!amountProvided);
	const paymentGateway = searchParams.get("paymentGateway") || "gocardless";
	const stripeMode = searchParams.get("stripeMode") || "live";
	const projectId = searchParams.get("projectId") || null;
	const givingTo = searchParams.get("givingTo") || null;
	const donorType = searchParams.get("donorType") || null;
	const organisationName = searchParams.get("organisationName") || null;

	const supportedCurrencies = {
		gocardless: ["gbp"],
		stripe: ["usd", "gbp"],
	};
	const isCurrencyAccepted =
		supportedCurrencies[paymentGateway]?.includes(initialCurrency);
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
		setValue,
	} = methods;
	const [steps, setSteps] = useState(() => {
		let updatedSteps = updateStepsWithParams(
			initialSteps,
			searchParams,
			paymentGateway
		);
		const currency = searchParams.get("currency") || initialCurrency;
		const givingFrequency =
			searchParams.get("givingFrequency") || defaultValues.givingFrequency;
		return updateStepsBasedOnSelections(
			updatedSteps,
			currency,
			givingFrequency
		);
	});

	useEffect(() => {
		// Watch all fields, extract currency and givingFrequency
		let currency = initialCurrency;
		const subscription = watch((value) => {
			currency = value.currency || initialCurrency;
			const givingFrequency =
				value.givingFrequency || defaultValues.givingFrequency;
			onCurrencyChange(currency);
			//then update steps
			setSteps((currentSteps) => {
				const updatedSteps = updateStepsBasedOnSelections(
					currentSteps,
					currency,
					givingFrequency
				);
				return updatedSteps;
			});
		});
		onCurrencyChange(currency);
		return () => subscription.unsubscribe();
	}, [watch, initialCurrency, defaultValues.givingFrequency, onCurrencyChange]);

	//next step
	const nextStep = async () => {
		const fields = getFieldIdsExcludingRemoved(steps[step].fields);
		const valid = await trigger(fields, { shouldFocus: true });
		console.log(valid, errors);
		const formData = getValues();

		if (valid) {
			setIsLoading(true);
			const stepData = getValues(fields);
			console.log(`Data from step ${step + 1}:`, stepData);

			//look for preferences if the step is 0 and the currency is gbp
			if (step === 0 && formData.currency === "gbp") {
				const getPreferences = await fetch("/api/getPreferences", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						email: formData.email,
					}),
				});

				const getPreferencesData = await getPreferences.json();

				if (getPreferencesData.preferences) {
					// Update the form fields with the preferences
					const extractedPreferences = await extractPreferences(
						getPreferencesData
					);
					if (extractedPreferences) {
						console.log(extractedPreferences);
						setValue(
							"emailPreference",
							String(extractedPreferences.emailPreference)
						);
						setValue(
							"postPreference",
							String(extractedPreferences.postPreference)
						);
						setValue(
							"smsPreference",
							String(extractedPreferences.smsPreference)
						);
						setValue(
							"phonePreference",
							String(extractedPreferences.phonePreference)
						);
					}

					// Update the description of step 4
					setSteps((prevSteps) =>
						prevSteps.map((s) =>
							s.id === "step4"
								? {
										...s,
										description: `These are the preferences we hold for ${formData.email} for how we can contact you about the work of Hope for Justice and how your support is making a difference:`,
								  }
								: s
						)
					);
				}
			}

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
			setIsLoading(false);
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

	// On Submit
	const onSubmit = async () => {
		const valid = await trigger();

		if (!valid) return;

		const formData = getValues();
		setIsSubmitting(true);

		try {
			let response;

			if (paymentGateway === "stripe") {
				const stripe = await getStripePromise({
					currency: formData.currency,
					mode: stripeMode,
				});

				response = await fetch("/api/processStripe", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						...formData,
						stripeMode,
						projectId,
						givingTo,
						donorType,
						organisationName,
					}),
				});

				const data = await response.json();

				if (!response.ok) {
					throw new Error(data.message || "Stripe session creation failed.");
				}

				// Redirect to Stripe Checkout
				const result = await stripe.redirectToCheckout({
					sessionId: data.sessionId,
				});

				if (result.error) {
					throw new Error(result.error.message);
				}

				return; // stop here after Stripe redirect
			}

			// Handle GoCardless
			if (paymentGateway === "gocardless") {
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
		return (
			<div>
				The currency set is not currently accepted for this payment gateway
			</div>
		);
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
				{step !== steps.length - 1 ? (
					<Button
						onClick={nextStep}
						text={isLoading ? "Loading..." : "Next Step"}
						size="extraLarge"
						extraClasses="ml-auto"
					/>
				) : paymentGateway === "stripe" ? (
					<Button
						onClick={onSubmit}
						text={isSubmitting ? "Submitting..." : "Proceed to payment"}
						size="extraLarge"
						extraClasses="ml-auto"
						disabled={isSubmitting}
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
