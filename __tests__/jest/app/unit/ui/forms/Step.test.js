import React from "react";
import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import Step from "@/app/ui/forms/Step";
import { useFormContext } from "react-hook-form";
import {
	findCurrencySymbol,
	formatAmount,
	getAcceptedCurrencies,
} from "@/app/lib/utilities";

// Mock react-hook-form functions
jest.mock("react-hook-form", () => ({
	useFormContext: jest.fn(),
}));

// Mock helper functions
jest.mock("@/app/lib/utilities", () => ({
	findCurrencySymbol: jest.fn(),
	formatAmount: jest.fn(),
}));

describe("Step component", () => {
	const mockRegister = jest.fn();
	const mockWatch = jest.fn();
	const mockOnShowGivingDetails = jest.fn();

	beforeEach(() => {
		useFormContext.mockReturnValue({
			register: mockRegister,
			watch: mockWatch,
			formState: { errors: {} },
		});
		findCurrencySymbol.mockReturnValue("£");
		formatAmount.mockReturnValue("100.00");
		mockWatch.mockReturnValue({ amount: "100", currency: "gbp" });
	});

	const stepData = {
		title: "Step Title",
		description: "Step description",
		fields: [
			{
				id: "givingPreview",
				type: "givingPreview",
			},
			{
				id: "amount",
				type: "amount",
				label: "Donation Amount",
				optional: true,
				acceptedCurrencies: [{ value: "gbp", text: "GBP" }],
			},
			{ id: "email", type: "email", label: "Email" },
			{
				id: "inspirationQuestion",
				type: "select",
				label: "How did you hear about us?",
				options: [{ value: "internet", text: "Internet" }],
			},
			{
				id: "givingFrequency",
				type: "select",
				label: "Frequency",
				defaultValue: "monthly",
				options: [
					{ text: "Monthly", value: "monthly" },
					// { text: "Once", value: "once" },
				],
			},
			{
				id: "givingSummary",
				type: "givingSummary",
			},
			{ id: "test", type: "test", label: "test" },
		],
	};

	it("renders the step title and description", () => {
		render(<Step stepData={stepData} />);
		expect(screen.getByText("Step Title")).toBeInTheDocument();
		expect(screen.getByText("Step description")).toBeInTheDocument();
	});

	it("renders amount field with default value", () => {
		render(<Step stepData={stepData} />);

		expect(screen.getByLabelText("Donation Amount")).toBeInTheDocument();
		expect(findCurrencySymbol).toHaveBeenCalledWith("gbp");
	});

	it("renders email field", () => {
		render(<Step stepData={stepData} />);
		expect(screen.getByLabelText("Email")).toBeInTheDocument();
	});

	it("renders select field with options", () => {
		render(<Step stepData={stepData} />);
		const selectField = screen.getByLabelText("How did you hear about us?");
		expect(selectField).toBeInTheDocument();
		expect(
			screen.getByRole("option", { name: "Internet" })
		).toBeInTheDocument();
	});

	it("renders giving summary with formatted total and currency", () => {
		mockWatch.mockReturnValue({
			amount: "100",
			currency: "gbp",
			givingFrequency: "monthly",
			giftAid: true,
		});
		render(<Step stepData={stepData} />);

		expect(screen.getByText("Donation Total:")).toBeInTheDocument();
		expect(screen.getByText("£100.00 GBP")).toBeInTheDocument();
		expect(screen.getByText("Giving Frequency:")).toBeInTheDocument();
		expect(screen.getByText("monthly")).toBeInTheDocument();
		expect(screen.getByText("Gift Aid:")).toBeInTheDocument();
		expect(screen.getByText("Yes")).toBeInTheDocument();
	});

	it("handles conditional rendering for field group (giving details)", () => {
		const conditionalStepData = {
			...stepData,
			fields: [
				{
					id: "givingDetails",
					type: "fieldGroup",
					fields: [{ id: "subField1", type: "text", label: "SubField 1" }],
				},
			],
		};
		render(
			<Step
				stepData={conditionalStepData}
				showGivingDetails={false}
				onShowGivingDetails={mockOnShowGivingDetails}
			/>
		);
		expect(screen.queryByLabelText("SubField 1")).not.toBeInTheDocument();

		// Rerender with showGivingDetails = true
		render(
			<Step
				stepData={conditionalStepData}
				showGivingDetails={true}
				onShowGivingDetails={mockOnShowGivingDetails}
			/>
		);
		expect(screen.getByLabelText("SubField 1")).toBeInTheDocument();
	});

	it("renders giving preview with monthly text", () => {
		formatAmount.mockReturnValue("200.00");
		mockWatch.mockReturnValue({
			amount: "200",
			currency: "gbp",
			givingFrequency: "monthly",
		});

		const { container } = render(<Step stepData={stepData} />);
		const givingPreview = container.querySelector("#givingPreview");

		expect(givingPreview).toBeInTheDocument();
		expect(givingPreview).toHaveTextContent("monthly");
		expect(givingPreview).toHaveTextContent("£200.00");
	});

	it("renders giving preview with currency symbol at the end", () => {
		formatAmount.mockReturnValue("200.00");
		findCurrencySymbol.mockReturnValue("Kr");
		mockWatch.mockReturnValue({
			amount: "200",
			currency: "nok",
			givingFrequency: "monthly",
		});

		const { container } = render(<Step stepData={stepData} />);
		const givingPreview = container.querySelector("#givingPreview");

		expect(givingPreview).toBeInTheDocument();
		expect(givingPreview).toHaveTextContent("monthly");
		expect(givingPreview).toHaveTextContent("200.00 Kr");
	});

	it("doesn't render giving preview if amount isn't provided", () => {
		formatAmount.mockReturnValue(null);
		findCurrencySymbol.mockReturnValue("Kr");
		mockWatch.mockReturnValue({
			amount: 0,
			currency: "nok",
			givingFrequency: "monthly",
		});

		const { container } = render(<Step stepData={stepData} />);
		const givingPreview = container.querySelector("#givingPreview");

		expect(givingPreview).not.toBeInTheDocument();
	});
});
