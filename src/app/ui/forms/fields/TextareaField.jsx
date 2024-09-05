import React from "react";
import { useFormContext } from "react-hook-form";
import clsx from "clsx";

const TextareaField = ({ id, label, register, errors, optional }) => {
	return (
		<div className={`mb-4`}>
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
			<textarea
				id={id}
				name={id}
				rows="4"
				className={clsx(
					"mt-2 block w-full rounded-md border-0 py-1.5 text-gray-900 ring-1 ring-inset focus:ring-2 sm:text-sm sm:leading-6",
					errors && errors[id]
						? "ring-red-500 focus:ring-red-500"
						: "ring-gray-300 focus:ring-hfj-black"
				)}
				{...register(id)}
			></textarea>
			{errors && errors[id] && (
				<p id={`${id}-error`} className="mt-2 text-sm text-red-600">
					{errors[id]?.message}
				</p>
			)}
		</div>
	);
};

export default TextareaField;
