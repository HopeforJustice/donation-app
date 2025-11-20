import { findCurrencySymbol } from "@/app/lib/utilities";
import SubmitButton from "../buttons/SubmitButton";
import HorizontalRule from "../HorizontalRule";
import { useSearchParams } from "next/navigation";
import { formatAmountWithLocale } from "@/app/lib/utilities";
import { matchFundingOn } from "@/app/lib/utils/formUtils";

export default function GivingSummary({
	amount,
	giftAid = false,
	givingFrequency,
	currency,
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
						<div className="mt-4 p-4 rounded-lg mb-4 text-sm bg-hfj-yellow-tint2/20 flex justify-start gap-3">
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
								{givingFrequency === "once" && (
									<>
										Thanks to a generous match funder your{" "}
										{findCurrencySymbol(currency)}
										{formattedAmount} gift is being DOUBLED to{" "}
										{findCurrencySymbol(currency)}
										{formattedDoubledAmount}!
									</>
								)}
								{givingFrequency === "monthly" && (
									<>
										Thanks to a generous match funder, regular gifts set up
										during this special period will be DOUBLED each month for
										the first year, so your {findCurrencySymbol(currency)}
										{formattedAmount} a month will be doubled to{" "}
										{findCurrencySymbol(currency)}
										{formattedDoubledAmount} a month for the first 12 months of
										your giving!
									</>
								)}
							</p>
						</div>
					)}
				</div>
				<SubmitButton
					currency={currency}
					givingFrequency={givingFrequency}
					amount={amount}
				/>
			</div>
		</div>
	);
}
