import { findCurrencySymbol } from "@/app/lib/utilities";
import SubmitButton from "../buttons/SubmitButton";
import HorizontalRule from "../HorizontalRule";
import { useSearchParams } from "next/navigation";
import { formatAmountWithLocale } from "@/app/lib/utilities";
import { matchFundingOn } from "@/app/lib/utils/formUtils";
import MatchFundingAlert from "./fields/MatchFundingAlert";

export default function GivingSummary({
	amount,
	giftAid = false,
	givingFrequency,
	currency,
	setIsModalOpen,
}) {
	const searchParams = useSearchParams();
	const campaignCode = searchParams.get("campaign") || null;
	const matchFunding = matchFundingOn(campaignCode);
	const formattedAmount = formatAmountWithLocale(amount, currency);
	const doubled = amount * 2;
	const formattedDoubledAmount = formatAmountWithLocale(doubled, currency);
	const currencySymbol = findCurrencySymbol(currency);

	const giftAidTotal = giftAid ? (amount * 0.25).toFixed(2) : "0.00";
	if (currency === "usd" || giftAid === "false") {
		giftAid = false;
	}
	return (
		<div className="mt-8 xl:mt-0 relative w-full h-full flex flex-col items-center justify-center">
			<div className="max-xl:w-full xl:min-w-[50%]">
				{/* <h2 className="font-display text-4xl text-white mb-6 hidden xl:block">
					Ready to Make a difference?
				</h2> */}
				<div className="bg-white xl:p-6 rounded-md mb-4 max-w-lg">
					<h3 className="text-2xl font-bold">Giving Summary</h3>
					<HorizontalRule className="my-4" />
					<div className="flex flex-col gap-2">
						<div className="flex justify-between">
							<p>Donation</p>
							<p className="font-bold uppercase">
								{currency} {findCurrencySymbol(currency)}
								{amount}
							</p>
						</div>
						{currency === "gbp" && (
							<div className="flex justify-between">
								<p>Gift Aid</p>
								<p className="font-bold">{giftAid ? "Yes" : "No"}</p>
							</div>
						)}
						<div className="flex justify-between">
							<p>Giving Frequency</p>
							<p className="font-bold capitalize">{givingFrequency}</p>
						</div>
					</div>
					<HorizontalRule className="my-4" />
					<div className="flex justify-between">
						<p>Donation Total</p>
						<p className="font-bold">
							{findCurrencySymbol(currency)}
							{amount}{" "}
							<span className="font-normal">
								{giftAid &&
									`(+${findCurrencySymbol(currency)}${giftAidTotal} Gift Aid)`}
							</span>
						</p>
					</div>
					{matchFunding && (
						<MatchFundingAlert
							givingFrequency={givingFrequency}
							currency={currency}
							formattedAmount={formattedAmount}
							formattedDoubledAmount={formattedDoubledAmount}
							setIsModalOpen={setIsModalOpen}
						/>
					)}
				</div>
				<SubmitButton
					currency={currency}
					givingFrequency={givingFrequency}
					amount={amount}
					location="giving-summary"
				/>
			</div>
		</div>
	);
}
