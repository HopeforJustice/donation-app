import React from "react";
import { useSearchParams } from "next/navigation";
import {
	findCurrencySymbol,
	formatAmountWithLocale,
} from "@/app/lib/utilities";
import Button from "../../buttons/Button";

const GivingPreview = ({
	values,
	formattedAmount,
	allowedPaymentMethods = [],
	showGivingDetails,
	onShowGivingDetails,
	matchFunding,
}) => {
	const searchParams = useSearchParams();

	const doubled = values.amount * 2;
	const formattedDoubledAmount = formatAmountWithLocale(
		doubled,
		values.currency
	);
	const givingTo = searchParams.get("givingTo") || null;
	const allowChange = searchParams.get("allowChange") || "true";
	const showViaBankTransfer =
		allowedPaymentMethods.includes("pay_by_bank") ||
		allowedPaymentMethods.includes("customer_balance");

	const currencyCode = values.currency?.toUpperCase();
	const currencySymbol = findCurrencySymbol(values.currency);
	const isNOK = values.currency === "nok";

	// Format currency display based on NOK special handling
	const currencyPrefix = isNOK ? "" : currencySymbol;
	const currencySuffix = isNOK ? `${currencySymbol} ` : "";

	return (
		<>
			<p id="givingPreview" className="mb-4 flex gap-2 flex-wrap">
				You&apos;re giving {currencyCode} {currencyPrefix}
				{formattedAmount} {currencySuffix}
				{values.givingFrequency}
				{showViaBankTransfer && " Via Bank Transfer"}
				{givingTo && ` to ${givingTo}`}
				{allowChange === "true" && !showGivingDetails && (
					<Button
						text="Change giving details"
						size="small"
						onClick={onShowGivingDetails}
						buttonType="secondary"
					/>
				)}
			</p>
			{matchFunding && (
				<div className="p-4 rounded-lg mb-4 text-sm bg-hfj-yellow-tint2/20 flex justify-start gap-3">
					<div className="p-1">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="19.5"
							height="19.5"
							viewBox="0 0 19.5 19.5"
						>
							<path
								id="Path_17244"
								data-name="Path 17244"
								d="M11.25,11.25l.041-.02a.75.75,0,0,1,1.063.852l-.708,2.836a.75.75,0,0,0,1.063.853l.041-.021M21,12a9,9,0,1,1-9-9,9,9,0,0,1,9,9ZM12,8.25h.008v.008H12Z"
								transform="translate(-2.25 -2.25)"
								fill="none"
								stroke="#212322"
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth="1.5"
							/>
						</svg>
					</div>
					<p>
						{values.givingFrequency === "once" && (
							<>
								Thanks to a generous match funder your{" "}
								{findCurrencySymbol(values.currency)}
								{formattedAmount} gift is being DOUBLED to{" "}
								{findCurrencySymbol(values.currency)}
								{formattedDoubledAmount}!
							</>
						)}
						{values.givingFrequency === "monthly" && (
							<>
								Thanks to a generous match funder, regular gifts set up during
								this special period will be DOUBLED each month for the first
								year, so your {findCurrencySymbol(values.currency)}
								{formattedAmount} a month will be doubled to{" "}
								{findCurrencySymbol(values.currency)}
								{formattedDoubledAmount} a month for the first 12 months of your
								giving!
							</>
						)}
					</p>
				</div>
			)}
		</>
	);
};

export default GivingPreview;
