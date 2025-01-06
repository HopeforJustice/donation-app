import AddressSearch from "react-loqate";
import { InputHTMLAttributes, Ref, forwardRef } from "react";
import { useFormContext } from "react-hook-form";
import clsx from "clsx";
// to use the default styles for the default components
import "react-loqate/dist/index.css";

export default function AddressSearchLoqate({
	id,
	label,
	extraClasses = "",
	extraInputClasses = "",
	optional = false,
}) {
	const { setValue } = useFormContext();
	const handleSelectedAddress = (address) => {
		console.log(address);
		console.log(address.City);
		setValue("address1", address.Line1);
		setValue("address2", address.Line2);
		setValue("postcode", address.PostalCode);
		setValue("country", address.CountryName);
		setValue("townCity", address.City);
		setValue("stateCounty", address.ProvinceName);
	};
	const Input = forwardRef(({ className, ...rest }, ref) => (
		<input
			className={clsx(
				`block w-full rounded-md border-0 py-1.5 pt-2 text-hfj-black ring-1 ring-inset placeholder:text-gray-400 focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6 ring-gray-300 focus:ring-hfj-black`,
				className
			)}
			placeholder="Type your address to search"
			ref={ref}
			{...rest}
		/>
	));
	Input.displayName = "Input";

	const List = forwardRef(({ className, ...rest }, ref) => (
		<ul
			className={clsx(
				"react-loqate-default-list flex flex-col gap-2 z-10",
				className
			)}
			ref={ref}
			{...rest}
		/>
	));
	List.displayName = "List";
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
			<div className="mt-2 relative rounded-md shadow-sm">
				{/* API Key restricted to urls Loqate settings */}
				<AddressSearch
					locale="en-GB"
					apiKey="BP78-CZ38-AA26-DZ29"
					onSelect={(address) => handleSelectedAddress(address)}
					components={{
						Input,
						List,
					}}
				/>
			</div>
		</div>
	);
}
