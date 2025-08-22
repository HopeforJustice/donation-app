import clsx from "clsx";

const ToggleField = ({
	id,
	label,
	register,
	options,
	optional = false,
	errors,
	extraClasses = "",
	description = false,
	onChange,
	hidden,
	defaultValue,
}) => {
	const hiddenClasses = hidden ? "hidden" : "";
	return (
		<div className={`mb-4 ${extraClasses} ${hiddenClasses} w-full`}>
			<div className="flex justify-between">
				<div>
					{/* icon here */}
					<label
						htmlFor={id}
						className="block text-sm font-medium leading-4 text-hfj-black"
					>
						{label}
					</label>
					{description && (
						<p
							id={`${id}-description`}
							className="mt-4 text-sm text-hfj-black-tint1"
						>
							{description}
						</p>
					)}
				</div>
				<div className="group relative inline-flex w-11 shrink-0 rounded-full bg-gray-200 p-0.5 inset-ring inset-ring-gray-900/5 outline-offset-2 outline-indigo-600 transition-colors duration-200 ease-in-out has-checked:bg-indigo-600 has-focus-visible:outline-2">
					<span className="size-5 rounded-full bg-white shadow-xs ring-1 ring-gray-900/5 transition-transform duration-200 ease-in-out group-has-checked:translate-x-5" />
					<input
						name="setting"
						type="checkbox"
						aria-label="Use setting"
						className="absolute inset-0 appearance-none focus:outline-hidden"
						aria-describedby={`${id}-description`}
						{...register(id)}
						{...(onChange ? { onChange: (e) => onChange(e) } : {})} // Conditional inclusion of onChange function
					/>
				</div>
			</div>
			{/* <select
				id={id}
				name={id}
				className={clsx(
					`mt-2 block w-full rounded-md border-0 py-1.5 pt-2 pl-3 pr-10 text-gray-900 ring-1 ring-inset focus:ring-2  sm:text-sm sm:leading-6 [&.green]:bg-green-200  [&.red]:bg-red-200 ${extraInputClasses}`,
					errors[id]
						? "ring-red-500 focus:ring-red-500"
						: "ring-gray-300 focus:ring-hfj-black"
				)}
				aria-describedby={`${id}-optional`}
				{...register(id)}
				{...(onChange ? { onChange: (e) => onChange(e) } : {})} // Conditional inclusion of onChange function
			>
				{!defaultValue && (
					<option value="">Select {optional && "(Optional)"}</option>
				)}
				{options.map((option) => (
					<option
						key={option.text}
						value={option.value}
						disabled={option.disabled}
					>
						{option.text}
					</option>
				))}
			</select> */}

			{errors[id] && (
				<p id={`${id}-error`} className="mt-2 text-sm text-red-600">
					{errors[id]?.message}
				</p>
			)}
		</div>
	);
};

export default ToggleField;
