import React from "react";
import { useFormContext } from "react-hook-form";
import InputField from "@/app/ui/forms/fields/InputField";
import SelectField from "@/app/ui/forms/fields/SelectField";
import TextareaField from "@/app/ui/forms/fields/TextareaField";
import { findCurrencySymbol, formatAmount } from "@/app/lib/utilities";
import Button from "../buttons/Button";
import AmountField from "./fields/AmountField";
import AddressSearchLoqate from "./fields/AddressSearchLoqate";
import { useSearchParams } from "next/navigation";
import StripePaymentStep from "./fields/StripePaymentStep";
import PayPalPaymentStep from "./fields/PayPalPaymentStep";
import ToggleField from "./fields/ToggleField";

const Field = ({
	field,
	showGivingDetails,
	onShowGivingDetails,
	currency,
	frequency,
}) => {
	const {
		register,
		watch,
		formState: { errors },
	} = useFormContext();

	const values = watch();
	const searchParams = useSearchParams();

	const givingTo = searchParams.get("givingTo") || null;
	const allowChange = searchParams.get("allowChange") || "true";

	// Watch the value of inspirationQuestion
	const inspirationValue = watch("inspirationQuestion");

	const amount = Number(values.amount);

	const formattedAmount =
		amount % 1 === 0
			? amount.toLocaleString() // whole number — no decimals
			: amount.toLocaleString(undefined, {
					minimumFractionDigits: 2,
					maximumFractionDigits: 2,
			  }); // decimal — show 2 places

	switch (field.type) {
		case "givingPreview":
			if (values.amount) {
				return (
					<p id="givingPreview" className="mb-4 flex gap-2 flex-wrap">
						You&apos;re giving {values.currency?.toUpperCase()}{" "}
						{values.currency !== "nok"
							? findCurrencySymbol(values.currency)
							: ""}
						{formattedAmount}{" "}
						{values.currency === "nok"
							? findCurrencySymbol(values.currency) + " "
							: ""}
						{values.givingFrequency} {givingTo && `to ${givingTo}`}
						{allowChange === "true" && !showGivingDetails && (
							<Button
								text="Change giving details"
								size="small"
								onClick={onShowGivingDetails}
								buttonType="secondary"
							/>
						)}
					</p>
				);
			} else {
				return null;
			}
		case "text":
			return (
				<InputField
					id={field.id}
					label={field.label}
					type="text"
					register={register}
					errors={errors}
					placeholder={field.placeholder}
					ariaDescription={field.ariaDescription}
					extraClasses={field.extraClasses}
					extraInputClasses={field.extraInputClasses}
					defaultValue={field.defaultValue}
					onInput={field.onInput}
					description={field.description}
					optional={field.optional}
					hidden={field.hidden}
					descriptionAbove={field.descriptionAbove}
				/>
			);
		case "addressSearch":
			return (
				<AddressSearchLoqate
					id={field.id}
					label={field.label}
					extraClasses={field.extraClasses}
					extraInputClasses={field.extraInputClasses}
					hidden={field.hidden}
				/>
			);

		case "amount":
			return (
				<AmountField
					id={field.id}
					label={field.label}
					type="text"
					register={register}
					errors={errors}
					placeholder={field.placeholder}
					ariaDescription={field.ariaDescription}
					extraClasses={field.extraClasses}
					extraInputClasses={field.extraInputClasses}
					defaultValue={field.defaultValue}
					onInput={field.onInput}
					description={field.description}
					optional={field.optional}
					hidden={field.hidden}
					currency={values.currency}
					currencySymbol={findCurrencySymbol(values.currency)}
					acceptedCurrencies={field.acceptedCurrencies}
				/>
			);
		case "email":
			return (
				<InputField
					id={field.id}
					label={field.label}
					type="email"
					register={register}
					errors={errors}
					description={field.description}
					optional={field.optional}
					hidden={field.hidden}
					defaultValue={field.defaultValue}
				/>
			);
		case "select":
			// Watch the value of the current field
			const fieldValue = watch(field.id);

			// Determine the extraClasses based on the fieldValue
			const extraInputClasses =
				fieldValue === "true" ? "green" : fieldValue === "false" ? "red" : "";
			return (
				<SelectField
					id={field.id}
					label={field.label}
					register={register}
					options={field.options}
					optional={field.optional}
					errors={errors}
					description={field.description}
					onChange={field.onChange}
					extraInputClasses={extraInputClasses}
					defaultValue={field.defaultValue}
					hidden={field.hidden}
					descriptionAbove={field.descriptionAbove}
				/>
			);
		case "toggle":
			return (
				<ToggleField
					id={field.id}
					label={field.label}
					register={register}
					options={field.options}
					optional={field.optional}
					errors={errors}
					description={field.description}
					onChange={field.onChange}
					defaultValue={field.defaultValue}
					hidden={field.hidden}
					icon={field.icon}
				/>
			);
		case "fieldGroup":
			if (field.id === "givingDetails" && !showGivingDetails) {
				return null;
			}
			return (
				<div className="">
					<div
						className={`grid grid-cols-1 gap-x-6 ${
							field.columns === 1 ? "" : "sm:grid-cols-2"
						}`}
					>
						{field.fields.map((subField) => (
							<Field
								key={subField.id}
								field={subField}
								showGivingDetails={showGivingDetails}
								onShowGivingDetails={onShowGivingDetails}
								currency={currency}
							/>
						))}
					</div>
					{field.description && (
						<div className="">
							{Array.isArray(field.description) ? (
								field.description.map((paragraph, index) => (
									<div
										key={index}
										className="mb-4 text-sm text-hfj-black-tint1"
										dangerouslySetInnerHTML={{ __html: paragraph }}
									></div>
								))
							) : (
								<div
									className="mb-4 text-sm text-hfj-black-tint1"
									dangerouslySetInnerHTML={{ __html: field.description }}
								></div>
							)}
						</div>
					)}
				</div>
			);
		case "givingSummary":
			return (
				<div className="mb-6">
					<p>
						<strong>Donation Total:</strong>{" "}
						{values.currency === "nok"
							? values.currency.toUpperCase() + " "
							: findCurrencySymbol(values.currency)}
						{formatAmount(values.amount, values.currency)}{" "}
						{values.currency === "nok"
							? findCurrencySymbol(values.currency)
							: values.currency.toUpperCase()}
					</p>
					<p>
						<strong>Giving Frequency:</strong>{" "}
						<span className="capitalize">{values.givingFrequency}</span>
					</p>
					{values.currency === "gbp" && (
						<p>
							<strong>Gift Aid:</strong>{" "}
							{values.giftAid === "true" ? "Yes" : "No"}
						</p>
					)}
				</div>
			);
		case "textarea":
			if (
				(field.id === "inspirationDetails" && inspirationValue === "") ||
				(field.id === "inspirationDetails" && inspirationValue === undefined)
			) {
				return null;
			}
			return (
				<TextareaField
					id={field.id}
					label={field.label}
					register={register}
					errors={errors}
					optional={field.optional}
				/>
			);
		case "stripePaymentStep":
			return (
				<div data-testid="stripe-payment-step">
					<StripePaymentStep
						amount={values.amount}
						givingFrequency={values.givingFrequency}
						currency={values.currency}
					/>
				</div>
			);
		case "payPalPaymentStep":
			return (
				<div data-testid="paypal-payment-step">
					<PayPalPaymentStep
						amount={values.amount}
						givingFrequency={values.givingFrequency}
						currency={values.currency}
					/>
				</div>
			);
		default:
			return null;
	}
};

const Step = ({
	stepData,
	showGivingDetails,
	onShowGivingDetails,
	currency,
	frequency,
	onCurrencyChange,
	onSubmit,
}) => {
	return (
		<div className="">
			<h2
				className={`text-2xl font-bold ${stepData.subtitle ? "mb-1" : "mb-4"}`}
			>
				{stepData.title}
			</h2>
			{stepData.subtitle && (
				<h3 className="text-xl mb-4  text-hfj-black-tint1">
					{stepData.subtitle}
				</h3>
			)}
			{stepData.description && (
				<div
					className="mb-8 text-hfj-black-tint1"
					dangerouslySetInnerHTML={{ __html: stepData.description }}
				></div>
			)}
			{stepData.fields.map((field) => (
				<Field
					key={field.id || field.fields[0].id}
					field={field}
					showGivingDetails={showGivingDetails}
					onShowGivingDetails={onShowGivingDetails}
					currency={currency}
					frequency={frequency}
					onCurrencyChange={onCurrencyChange}
				/>
			))}
		</div>
	);
};

export default Step;
