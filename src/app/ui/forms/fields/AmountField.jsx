import React, { useEffect } from "react";
import { useFormContext } from "react-hook-form";
import clsx from "clsx";

const AmountField = ({
	id,
	label,
	type = "text",
	register,
	errors,
	placeholder,
	defaultValue,
	ariaDescription,
	extraClasses = "",
	extraInputClasses = "",
	optional = false,
	hidden,
	onInput,
	currency,
	currencySymbol,
	acceptedCurrencies,
	allowedPaymentMethods = [],
}) => {
	const hiddenClasses = hidden ? "hidden" : "";
	const disableCurrencySelector =
		allowedPaymentMethods.includes("pay_by_bank") ||
		allowedPaymentMethods.includes("customer_balance");

	const { setValue } = useFormContext();

	return (
		<div className={`mb-4 ${extraClasses} ${hiddenClasses}`}>
			<div className="flex justify-between">
				<label
					htmlFor={id}
					className="block text-sm font-medium leading-4 text-hfj-black"
				>
					{label}
				</label>
				{optional && (
					<span
						id={`${id}-optional`}
						className="text-sm leading-4 text-gray-500"
					>
						Optional
					</span>
				)}
			</div>
			<div className="mt-2 relative rounded-md shadow-sm">
				<div className="pointer-events-none absolute inset-y-0 left-0 flex items-center mt-0.5 pl-3">
					<span className="text-gray-500 sm:text-sm">{currencySymbol}</span>
				</div>

				<input
					id={id}
					name={id}
					type={type}
					placeholder={defaultValue ? defaultValue : placeholder}
					onInput={(e) => onInput(e, currency)} // Pass the currency to the onInput function
					defaultValue={defaultValue}
					aria-describedby={errors[id] ? `${id}-error` : ariaDescription}
					{...register(id)}
					className={clsx(
						`block w-full rounded-md border-0 py-1.5 pt-2 text-hfj-black ring-1 ring-inset placeholder:text-gray-400 focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6 ${extraInputClasses}`,
						errors[id]
							? "ring-red-500 focus:ring-red-500"
							: "ring-gray-300 focus:ring-hfj-black",
						id === "amount" && currency !== "nok" ? "pr-12 pl-7" : "",
						id === "amount" && currency === "nok" ? "pr-18 pl-8" : ""
					)}
				/>
				{!disableCurrencySelector && (
					<div className="absolute inset-y-0 right-0 flex items-center">
						<label htmlFor="currency" className="sr-only">
							Currency
						</label>
						<select
							id="currency"
							name="currency"
							className="h-full rounded-md border-0 bg-transparent py-0 pl-2 pr-7 text-gray-500 focus:ring-2 focus:ring-inset focus:ring-hfj-black sm:text-sm"
							onChange={(e) => {
								setValue("currency", e.target.value);
								console.log("currency changed:" + e.target.value);
							}}
							value={currency} // Use the value prop to control the select element
							disabled={disableCurrencySelector}
						>
							{acceptedCurrencies.map((currency) => (
								<option key={currency.value} value={currency.value}>
									{currency.text}
								</option>
							))}
						</select>
					</div>
				)}
			</div>
			{errors[id] && (
				<p id={`${id}-error`} className="mt-2 text-sm text-red-600">
					{errors[id]?.message}
				</p>
			)}
		</div>
	);
};

export default AmountField;
