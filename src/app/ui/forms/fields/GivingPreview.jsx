import React from "react";
import { useSearchParams } from "next/navigation";
import {
	findCurrencySymbol,
	formatAmountWithLocale,
} from "@/app/lib/utilities";
import Button from "../../buttons/Button";
import MatchFundingAlert from "./MatchFundingAlert";

const GivingPreview = ({
	values,
	formattedAmount,
	allowedPaymentMethods = [],
	showGivingDetails,
	onShowGivingDetails,
	matchFunding,
	setIsModalOpen,
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
				<MatchFundingAlert
					givingFrequency={values.givingFrequency}
					currency={values.currency}
					formattedAmount={formattedAmount}
					formattedDoubledAmount={formattedDoubledAmount}
					setIsModalOpen={setIsModalOpen}
				/>
			)}
		</>
	);
};

export default GivingPreview;
