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
							: "ring-gray-300 focus:ring-hfj-black"
					)}
				/>
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
