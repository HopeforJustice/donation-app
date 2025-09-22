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

// Mock Next.js navigation
jest.mock("next/navigation", () => ({
	useSearchParams: jest.fn(() => ({
		get: jest.fn((key) => {
			// Return default mock values for common search params
			if (key === "givingTo") return null;
			if (key === "allowChange") return "true";
			return null;
		}),
	})),
}));

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
		// Mock watch to return different values based on how it's called
		mockWatch.mockImplementation((fieldName) => {
			const defaultValues = {
				amount: "100",
				currency: "gbp",
				givingFrequency: "monthly",
				giftAid: false,
			};

			if (fieldName === undefined) {
				// When called with no arguments, return all values
				return defaultValues;
			} else if (Array.isArray(fieldName)) {
				// When called with array of field names
				return fieldName.reduce((acc, field) => {
					acc[field] = defaultValues[field] || "";
					return acc;
				}, {});
			}
			return defaultValues[fieldName] || "";
		});
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
		// Override the mock for this specific test to set giftAid to true
		mockWatch.mockImplementation((fieldName) => {
			const testValues = {
				amount: "100",
				currency: "gbp",
				givingFrequency: "monthly",
				giftAid: "true", // Use string "true" instead of boolean
			};

			if (fieldName === undefined) {
				// When called with no arguments, return all values
				return testValues;
			} else if (Array.isArray(fieldName)) {
				return fieldName.reduce((acc, field) => {
					acc[field] = testValues[field] || "";
					return acc;
				}, {});
			}
			return testValues[fieldName] || "";
		});

		render(<Step stepData={stepData} />);

		expect(screen.getByText("Donation Total:")).toBeInTheDocument();
		// Look specifically in the donation summary section for the amount
		const donationSummary = screen.getByText("Donation Total:").parentElement;
		expect(donationSummary).toHaveTextContent("£100.00");
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
		mockWatch.mockImplementation((fieldName) => {
			const testValues = {
				amount: "200",
				currency: "gbp",
				givingFrequency: "monthly",
			};

			if (fieldName === undefined) {
				return testValues;
			} else if (Array.isArray(fieldName)) {
				return fieldName.reduce((acc, field) => {
					acc[field] = testValues[field] || "";
					return acc;
				}, {});
			}
			return testValues[fieldName] || "";
		});

		const { container } = render(<Step stepData={stepData} />);
		const givingPreview = container.querySelector("#givingPreview");

		expect(givingPreview).toBeInTheDocument();
		expect(givingPreview).toHaveTextContent("monthly");
		expect(givingPreview.textContent).toContain("£200");
	});

	it("renders giving preview with currency symbol at the end", () => {
		formatAmount.mockReturnValue("200.00");
		findCurrencySymbol.mockReturnValue("Kr");
		mockWatch.mockImplementation((fieldName) => {
			const testValues = {
				amount: "200",
				currency: "nok",
				givingFrequency: "monthly",
			};

			if (fieldName === undefined) {
				return testValues;
			} else if (Array.isArray(fieldName)) {
				return fieldName.reduce((acc, field) => {
					acc[field] = testValues[field] || "";
					return acc;
				}, {});
			}
			return testValues[fieldName] || "";
		});

		const { container } = render(<Step stepData={stepData} />);
		const givingPreview = container.querySelector("#givingPreview");

		expect(givingPreview).toBeInTheDocument();
		expect(givingPreview).toHaveTextContent("monthly");
		expect(givingPreview.textContent).toContain("200");
		expect(givingPreview.textContent).toContain("Kr");
	});

	it("doesn't render giving preview if amount isn't provided", () => {
		formatAmount.mockReturnValue(null);
		findCurrencySymbol.mockReturnValue("Kr");
		mockWatch.mockImplementation((fieldName) => {
			const testValues = {
				amount: 0,
				currency: "nok",
				givingFrequency: "monthly",
			};

			if (fieldName === undefined) {
				return testValues;
			} else if (Array.isArray(fieldName)) {
				return fieldName.reduce((acc, field) => {
					acc[field] = testValues[field] || "";
					return acc;
				}, {});
			}
			return testValues[fieldName] || "";
		});

		const { container } = render(<Step stepData={stepData} />);
		const givingPreview = container.querySelector("#givingPreview");

		expect(givingPreview).not.toBeInTheDocument();
	});
});
