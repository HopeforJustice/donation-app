import React from "react";
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import TextareaField from "@/app/ui/forms/fields/TextareaField";

describe("TextareaField component", () => {
	const mockRegister = jest.fn();

	const defaultProps = {
		id: "comments",
		label: "Comments",
		register: mockRegister,
		errors: {},
	};

	it("renders with required props", () => {
		render(<TextareaField {...defaultProps} />);

		expect(screen.getByLabelText("Comments")).toBeInTheDocument();
	});

	it("displays 'Optional' label when optional is true", () => {
		render(<TextareaField {...defaultProps} optional={true} />);

		expect(screen.getByText("Optional")).toBeInTheDocument();
	});

	it("does not display 'Optional' label when optional is false", () => {
		render(<TextareaField {...defaultProps} optional={false} />);

		expect(screen.queryByText("Optional")).not.toBeInTheDocument();
	});

	it("displays error message if there is an error", () => {
		const errors = { comments: { message: "Comments are required" } };
		render(<TextareaField {...defaultProps} errors={errors} />);

		expect(screen.getByText("Comments are required")).toBeInTheDocument();
	});

	it("applies error styling when there is an error", () => {
		const errors = { comments: { message: "Comments are required" } };
		render(<TextareaField {...defaultProps} errors={errors} />);

		const textarea = screen.getByLabelText("Comments");
		expect(textarea).toHaveClass("ring-red-500 focus:ring-red-500");
	});

	it("applies default styling when there is no error", () => {
		render(<TextareaField {...defaultProps} />);

		const textarea = screen.getByLabelText("Comments");
		expect(textarea).toHaveClass("ring-gray-300 focus:ring-hfj-black");
	});
});
