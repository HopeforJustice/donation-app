// InputField.js
import React from "react";
import clsx from "clsx";

const InputField = ({
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
}) => {
	const hiddenClasses = hidden ? "hidden" : "";
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
				{id === "amount" && (
					<div className="pointer-events-none absolute inset-y-0 left-0 flex items-center mt-0.5 pl-3">
						<span className="text-gray-500 sm:text-sm">
							{currency === "nok" ? currency.toUpperCase() : currencySymbol}
						</span>
					</div>
				)}
				<input
					id={id}
					name={id}
					type={type}
					placeholder={defaultValue ? defaultValue : placeholder}
					onInput={onInput}
					defaultValue={defaultValue}
					aria-describedby={errors[id] ? `${id}-error` : ariaDescription}
					{...register(id)}
					className={clsx(
						`block w-full rounded-md border-0 py-1.5 pt-2 text-hfj-black ring-1 ring-inset placeholder:text-gray-400 focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6 ${extraInputClasses}`,
						errors[id]
							? "ring-red-500 focus:ring-red-500"
							: "ring-gray-300 focus:ring-hfj-black",
						id === "amount" && currency !== "nok" ? "pr-12 pl-7" : "",
						id === "amount" && currency === "nok" ? "pr-18 pl-12" : ""
					)}
				/>
				{id === "amount" && (
					<div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
						<span
							id={`${id}-currency`}
							className="text-gray-500 mt-0.5 sm:text-sm"
						>
							{currency === "nok" ? currencySymbol : currency.toUpperCase()}
						</span>
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

export default InputField;
