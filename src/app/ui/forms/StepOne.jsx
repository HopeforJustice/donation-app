import React, { useEffect, useState } from "react";
import { onlyNumbers } from "@/app/lib/utilities";
import { useFormContext } from "react-hook-form";
import clsx from "clsx";
import InputField from "@/app/ui/forms/fields/InputField";
import SelectField from "@/app/ui/forms/fields/SelectField";

const StepOne = ({ title }) => {
	const {
		register,
		formState: { errors },
	} = useFormContext();
	const [isError, setIsError] = useState(false);

	useEffect(() => {
		setIsError(!!errors.amount);
	}, [errors.amount]);

	return (
		<div className="">
			<h2 className="text-2xl font-bold mb-4">{title}</h2>

			{/* Amount */}
			<InputField
				id="amount"
				label="Amount"
				type="text"
				register={register}
				errors={errors}
				placeholder="0.00"
				ariaDescription="amount-currency"
				extraClasses=""
				extraInputClasses="pl-7"
				onInput={onlyNumbers}
			/>

			{/* Title (optional) */}
			<SelectField
				id="title"
				label="Title"
				register={register}
				options={[
					{ text: "Mr", value: "Mr" },
					{ text: "Mrs", value: "Mrs" },
					{ text: "Miss", value: "Miss" },
					{ text: "Ms", value: "Ms" },
					{ text: "Dr", value: "Dr" },
					{ text: "Bishop", value: "Bishop" },
					{ text: "Friar", value: "Friar" },
					{ text: "Councillor", value: "Councillor" },
					{ text: "Professor", value: "Professor" },
					{ text: "Sir", value: "Sir" },
					{ text: "Lady", value: "Lady" },
				]}
				optional="true"
				errors={errors}
			/>

			{/* First and Last Name */}
			<div className="grid grid-cols-1 gap-x-6 sm:grid-cols-6">
				<div className="sm:col-span-3">
					<InputField
						id="firstName"
						label="First name"
						register={register}
						errors={errors}
					/>
				</div>
				<div className="sm:col-span-3">
					<InputField
						id="lastName"
						label="Last name"
						register={register}
						errors={errors}
					/>
				</div>
			</div>

			{/* Email */}
			<InputField
				id="email"
				label="Email"
				type="email"
				register={register}
				errors={errors}
			/>

			{/* Direct Debit Start Date (optional) */}
			<SelectField
				id="directDebitStartDate"
				label="On what date each month would you like your payment to be taken?"
				register={register}
				options={[
					{ text: "1st", value: 1 },
					{ text: "15th", value: 15 },
					{ text: "25th", value: 25 },
					{ text: "30th", value: 30 },
				]}
				errors={errors}
			/>

			<div className="inset-0 flex items-center">
				<div
					aria-hidden="true"
					className="w-full border-t border-gray-300 my-4"
				/>
			</div>
		</div>
	);
};

export default StepOne;
