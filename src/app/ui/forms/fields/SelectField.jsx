// SelectField.js
import React from "react";
import clsx from "clsx";

const SelectField = ({
	id,
	label,
	register,
	options,
	optional = false,
	errors,
	extraClasses = "",
	extraInputClasses = "",
}) => {
	return (
		<div className={`mb-4 ${extraClasses}`}>
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
			<select
				id={id}
				name={id}
				defaultValue=""
				className={clsx(
					`mt-2 block w-full rounded-md border-0 py-1.5 pt-2 pl-3 pr-10 text-gray-900 ring-1 ring-inset focus:ring-2  sm:text-sm sm:leading-6 ${extraInputClasses}`,
					errors[id]
						? "ring-red-500 focus:ring-red-500"
						: "ring-gray-300 focus:ring-hfj-black"
				)}
				aria-describedby={`${id}-optional`}
				{...register(id)}
			>
				<option value="">Select {optional && "(Optional)"}</option>
				{options.map((option) => (
					<option key={option.text} value={option.value}>
						{option.text}
					</option>
				))}
			</select>
			{errors[id] && (
				<p id={`${id}-error`} className="mt-2 text-sm text-red-600">
					{errors[id]?.message}
				</p>
			)}
		</div>
	);
};

export default SelectField;
