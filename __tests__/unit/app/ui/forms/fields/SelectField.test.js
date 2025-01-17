import React from "react";
import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import SelectField from "@/app/ui/forms/fields/SelectField";

describe("SelectField component", () => {
	const mockRegister = jest.fn();

	const defaultProps = {
		id: "country",
		label: "Country",
		register: mockRegister,
		options: [
			{ value: "us", text: "United States" },
			{ value: "ca", text: "Canada", disabled: true },
			{ value: "mx", text: "Mexico" },
		],
		errors: {},
	};

	it("renders with required props", () => {
		render(<SelectField {...defaultProps} />);

		expect(screen.getByLabelText("Country")).toBeInTheDocument();
		expect(
			screen.getByRole("option", { name: "United States" })
		).toBeInTheDocument();
		expect(screen.getByRole("option", { name: "Canada" })).toBeInTheDocument();
		expect(screen.getByRole("option", { name: "Mexico" })).toBeInTheDocument();
	});

	it("displays 'Optional' label when optional is true", () => {
		render(<SelectField {...defaultProps} optional={true} />);

		expect(screen.getByText("Optional")).toBeInTheDocument();
	});

	it("renders a default option if no defaultValue is provided and optional is true", () => {
		render(<SelectField {...defaultProps} optional={true} />);

		const defaultOption = screen.getByRole("option", {
			name: "Select (Optional)",
		});
		expect(defaultOption).toBeInTheDocument();
		expect(defaultOption).toHaveValue("");
	});

	it("does not render default option if defaultValue is provided", () => {
		render(<SelectField {...defaultProps} defaultValue="us" />);

		expect(
			screen.queryByRole("option", { name: "Select (Optional)" })
		).not.toBeInTheDocument();
	});

	it("displays error message if there is an error", () => {
		const errors = { country: { message: "Country is required" } };
		render(<SelectField {...defaultProps} errors={errors} />);

		expect(screen.getByText("Country is required")).toBeInTheDocument();
	});

	it("applies extra classes to outer div and select element", () => {
		render(
			<SelectField
				{...defaultProps}
				extraClasses="custom-outer-class"
				extraInputClasses="custom-input-class"
			/>
		);

		const outerDiv = screen.getByLabelText("Country").closest("div.mb-4");
		expect(outerDiv).toHaveClass("custom-outer-class");

		const select = screen.getByLabelText("Country");
		expect(select).toHaveClass("custom-input-class");
	});

	it("conditionally renders description when provided", () => {
		render(
			<SelectField {...defaultProps} description="Select your country." />
		);

		expect(screen.getByText("Select your country.")).toBeInTheDocument();
	});

	it("renders multiple description paragraphs if description is an array", () => {
		const description = [
			"First line of description.",
			"Second line of description.",
		];
		render(<SelectField {...defaultProps} description={description} />);

		description.forEach((desc) => {
			expect(screen.getByText(desc)).toBeInTheDocument();
		});
	});

	it("has hidden class if hidden is true", () => {
		const { container } = render(
			<SelectField {...defaultProps} hidden={true} />
		);

		expect(container.firstChild).toHaveClass("hidden");
	});

	it("calls onChange handler when selection changes", () => {
		const handleChange = jest.fn();
		render(<SelectField {...defaultProps} onChange={handleChange} />);

		const select = screen.getByLabelText("Country");
		fireEvent.change(select, { target: { value: "mx" } });
		expect(handleChange).toHaveBeenCalled();
	});
});
