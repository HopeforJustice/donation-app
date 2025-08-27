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
	description = false,
	onChange,
	hidden,
	defaultValue,
	descriptionAbove = false,
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
			{descriptionAbove && (
				<div id={`${id}-description`}>
					{Array.isArray(description) ? (
						description.map((paragraph, index) => (
							<p key={index} className="mt-2 text-sm text-hfj-black-tint1">
								{paragraph}
							</p>
						))
					) : (
						<p
							id={`${id}-description`}
							className="mt-2 text-sm text-hfj-black-tint1"
						>
							{description}
						</p>
					)}
				</div>
			)}
			<select
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
				defaultValue={defaultValue}
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
			</select>

			{errors[id] && (
				<p id={`${id}-error`} className="mt-2 text-sm text-red-600">
					{errors[id]?.message}
				</p>
			)}

			{description && !descriptionAbove && (
				<div id={`${id}-description`}>
					{Array.isArray(description) ? (
						description.map((paragraph, index) => (
							<p key={index} className="mt-4 text-sm text-hfj-black-tint1">
								{paragraph}
							</p>
						))
					) : (
						<p
							id={`${id}-description`}
							className="mt-4 text-sm text-hfj-black-tint1"
						>
							{description}
						</p>
					)}
				</div>
			)}
		</div>
	);
};

export default SelectField;
