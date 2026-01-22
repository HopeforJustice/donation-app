import { useState } from "react";
import { findCurrencySymbol } from "@/app/lib/utilities";

const MatchFundingAlert = ({
	givingFrequency,
	currency,
	formattedAmount,
	formattedDoubledAmount,
	setIsModalOpen,
}) => {
	return (
		<>
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
							{formattedDoubledAmount}!{" "}
							<button
								onClick={() => setIsModalOpen(true)}
								className="text-hfj-black hover:cursor-pointer underline focus:outline-none"
							>
								Learn more
							</button>
						</>
					)}
					{givingFrequency === "monthly" && (
						<>
							Thanks to a generous match funder, regular gifts set up during
							this special period will be DOUBLED each month for the first year,
							so your {findCurrencySymbol(currency)}
							{formattedAmount} a month will be doubled to{" "}
							{findCurrencySymbol(currency)}
							{formattedDoubledAmount} a month for the first 12 months of your
							giving!{" "}
							<button
								onClick={() => setIsModalOpen(true)}
								className="text-hfj-black hover:cursor-pointer underline focus:outline-none"
							>
								Learn more
							</button>
						</>
					)}
				</p>
			</div>
		</>
	);
};

export default MatchFundingAlert;
