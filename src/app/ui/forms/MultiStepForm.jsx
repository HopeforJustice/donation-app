"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { formSchema, createDynamicFormSchema } from "@/app/lib/schema";
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
import GivingSummary from "./GivingSummary";

const MultiStepForm = ({
	currency = "gbp",
	frequency = "monthly",
	setCurrency,
	setAmount,
	setGivingFrequency,
	setGiftAid,
	setLastStep,
	lastStep,
	desktopSize,
}) => {
	const searchParams = useSearchParams();
	const validate = searchParams.get("validate") || true;

	const [submissionError, setSubmissionError] = useState(null);
	const [isLoading, setIsLoading] = useState(false);
	const [step, setStep] = useState(0);

	const supportedCurrencies = ["usd", "gbp", "nok", "aud"];
	const isCurrencyAccepted = supportedCurrencies.includes(currency);

	const { defaultValues, amountProvided } = extractDefaultValues(
		stepTemplates,
		searchParams
	);

	function regenerateSteps({ currency, frequency }) {
		return generateSteps({ currency, frequency });
	}

	const methods = useForm({
		resolver: zodResolver(createDynamicFormSchema(currency)),
		mode: "onChange",
		delayError: 1500,
		defaultValues,
	});

	const {
		trigger,
		getValues,
		formState: { errors },
		watch,
		setValue,
	} = methods;

	const formData = getValues();

	const watchedCurrency = watch("currency") || defaultValues.currency;

	// Update resolver when currency changes
	useEffect(() => {
		const newSchema = createDynamicFormSchema(watchedCurrency);
		methods.resolver = zodResolver(newSchema);
	}, [watchedCurrency, methods]);
	const watchedFrequency =
		watch("givingFrequency") || defaultValues.givingFrequency;
	const watchedAmount = watch("amount") || null;
	const watchedGiftAid = watch("giftAid") || false;

	const [steps, setSteps] = useState(() =>
		regenerateSteps({ currency: watchedCurrency, frequency: watchedFrequency })
	);

	function updateStepDescription(stepId, newDescription) {
		console.log("updating steps", stepId, newDescription);
		setSteps((prevSteps) =>
			prevSteps.map((step) =>
				step.id === stepId ? { ...step, description: newDescription } : step
			)
		);
	}

	const [showGivingDetails, setShowAmountField] = useState(!amountProvided);

	useEffect(() => {
		// Only regenerate steps if currency or frequency changed
		setSteps((prevSteps) => {
			const newSteps = generateSteps({
				currency: watchedCurrency,
				frequency: watchedFrequency,
			});

			// Check if the visible fields have actually changed
			const prevFieldIds = prevSteps.flatMap((step) =>
				step.fields.map((field) => field.id)
			);
			const newFieldIds = newSteps.flatMap((step) =>
				step.fields.map((field) => field.id)
			);

			// If the structure and visible fields are the same, keep the previous steps
			if (
				prevSteps.length === newSteps.length &&
				prevSteps.every((step, index) => step.id === newSteps[index].id) &&
				prevFieldIds.length === newFieldIds.length &&
				prevFieldIds.every((id, index) => id === newFieldIds[index])
			) {
				console.log("no change in step structure or fields");
				return prevSteps;
			}
			console.log("step structure or fields changed");
			return newSteps;
		});

		// Update country field value based on currency change
		const currentCountry = getValues("country");
		let shouldUpdateCountry = false;
		let newCountryValue = "";

		if (watchedCurrency === "gbp" && currentCountry !== "United Kingdom") {
			shouldUpdateCountry = true;
			newCountryValue = "United Kingdom";
		} else if (
			watchedCurrency === "usd" &&
			currentCountry !== "United States"
		) {
			shouldUpdateCountry = true;
			newCountryValue = "United States";
		}

		if (shouldUpdateCountry) {
			setValue("country", newCountryValue);
		}

		setCurrency(watchedCurrency);
		setGivingFrequency(watchedFrequency);
		setAmount(watchedAmount);
		setGiftAid(watchedGiftAid);

		// Trigger amount field validation when currency changes
		// This ensures dynamic minimum amount validation runs
		if (watchedAmount) {
			trigger("amount");
		}
	}, [
		watchedCurrency,
		watchedFrequency,
		watchedAmount,
		watchedGiftAid,
		setCurrency,
		setGivingFrequency,
		setAmount,
		setGiftAid,
		getValues,
		setValue,
		trigger,
	]);

	// handling last step state
	useEffect(() => {
		if (step === steps.length - 1) {
			setLastStep(true);
		} else {
			setLastStep(false);
		}
	}, [step, steps.length, setLastStep]);

	// next step
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
			const formVals = getValues();
			if (step === 0 && formVals.currency === "gbp") {
				const prefsRes = await getPreferences(formVals.email);
				if (prefsRes?.preferences) {
					const extracted = await extractPreferences(prefsRes);
					if (extracted) {
						console.log("Extracted preferences:", extracted);
						const preferenceFields = [
							"emailPreference",
							"postPreference",
							"smsPreference",
							"phonePreference",
						];
						for (const field of preferenceFields) {
							const value = extracted[field];
							if (value !== undefined) setValue(field, value);
						}
						updateStepDescription(
							"preferences",
							`These are the preferences we hold for <strong>${formVals.email}</strong> for how we can contact you about the work of Hope for Justice and how your support is making a difference:`
						);
					}
				}
			}
			setStep((s) => s + 1);
		} else {
			// If validation failed on first step, show giving details so user can see and fix errors
			if (step === 0) {
				setShowAmountField(true);
			}
		}
		setIsLoading(false);
	};

	const prevStep = () => setStep((s) => s - 1);

	// Global submit orchestrator: validate, then route to GoCardless or card flow
	useEffect(() => {
		const fields = getFieldIdsExcludingRemoved(steps[step].fields);
		console.log("Fields to validate:", fields);
		async function handleGlobalSubmit() {
			window.dispatchEvent(
				new CustomEvent("donation:submitting", { detail: true })
			);
			try {
				const valid = await trigger(fields);
				if (!valid) {
					window.dispatchEvent(
						new CustomEvent("donation:submitting", { detail: false })
					);
					return;
				}

				const data = getValues();

				// GoCardless path (GBP monthly)
				if (data.currency === "gbp" && data.givingFrequency === "monthly") {
					try {
						const res = await fetch("/api/processDirectDebit", {
							method: "POST",
							headers: { "Content-Type": "application/json" },
							body: JSON.stringify(data),
						});
						const json = await res.json();
						if (!res.ok)
							throw new Error(json.message || "GoCardless submission failed.");

						if (json.response?.authorisationUrl) {
							window.location.href = json.response.authorisationUrl;
							return; // redirecting
						}
					} catch (err) {
						console.error(err);
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
						window.dispatchEvent(
							new CustomEvent("donation:submitting", { detail: false })
						);
						return;
					}
				} else {
					// Card/PaymentElement path — let the PaymentElement confirm
					window.dispatchEvent(new Event("donation:confirmPayment"));
				}
			} catch (e) {
				console.error(e);
				window.dispatchEvent(
					new CustomEvent("donation:submitting", { detail: false })
				);
			}
		}

		window.addEventListener("donation:requestSubmit", handleGlobalSubmit);
		return () =>
			window.removeEventListener("donation:requestSubmit", handleGlobalSubmit);
	}, [trigger, getValues, steps, step]);

	// Show the submit button for GoCardless if conditions are met
	useEffect(() => {
		const isGoCardless =
			watchedCurrency === "gbp" && watchedFrequency === "monthly";
		const isLastStep = step === steps.length - 1;

		if (isGoCardless && isLastStep) {
			window.dispatchEvent(new Event("donation:showButton"));
		}
	}, [watchedCurrency, watchedFrequency, step, steps.length]);

	// show giving details
	const showGivingDetailsHandler = () => setShowAmountField(true);

	if (!isCurrencyAccepted) {
		return <div>Error: The currency set is not currently accepted.</div>;
	}

	return (
		<div className="">
			{formData.amount > 5000 && formData.currency === "gbp" && (
				<div className="p-4 mb-4 border-2 border-hfj-red bg-hfj-red/10 rounded-md">
					<p className="text-hfj-black">
						For donations over £5,000 please contact our Supporter Care team on{" "}
						<a className="underline" href="tel:03000088000">
							0300 008 8000
						</a>{" "}
						or email{" "}
						<a
							className="underline"
							href="mailto:supporters@hopeforjustice.org"
						>
							supporters@hopeforjustice.org
						</a>
					</p>
				</div>
			)}
			{formData.amount > 10000 && formData.currency === "usd" && (
				<div className="p-4 mb-4 border-2 border-hfj-red bg-hfj-red/10 rounded-md">
					<p className="text-hfj-black">
						For donations over $10,000 please contact our Supporter Care team on{" "}
						<a className="underline" href="tel:+16153560946">
							(+1) 615-356-0946
						</a>{" "}
						or email{" "}
						<a
							className="underline"
							href="mailto:donorsupport.us@hopeforjustice.org"
						>
							donorsupport.us@hopeforjustice.org
						</a>
					</p>
				</div>
			)}
			<ProgressIndicator steps={steps} currentStep={step} />
			<FormProvider {...methods}>
				{/* prevent default submit; we use global events instead */}
				<form onSubmit={(e) => e.preventDefault()}>
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
										{value.message ? value.message : key}
									</span>
								))}
							</p>
						)}
					{step === steps.length - 1 && submissionError && (
						<p className="text-hfj-red text-sm">{submissionError}</p>
					)}
				</form>
			</FormProvider>

			{lastStep && !desktopSize && (
				<GivingSummary
					amount={watchedAmount}
					givingFrequency={watchedFrequency}
					currency={watchedCurrency}
					giftAid={watchedGiftAid}
				/>
			)}

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

				{!lastStep && (
					<Button
						onClick={nextStep}
						text={isLoading ? "Loading..." : "Next Step"}
						size="extraLarge"
						extraClasses="ml-auto"
					/>
				)}
			</div>
		</div>
	);
};

export default MultiStepForm;
