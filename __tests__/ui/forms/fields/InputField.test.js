import React from "react";
import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import { useFormContext } from "react-hook-form";
import InputField from "@/app/ui/forms/fields/InputField";

jest.mock("react-hook-form", () => ({
	useFormContext: jest.fn(),
}));

describe("InputField component", () => {
	const mockSetValue = jest.fn();
	const mockRegister = jest.fn();

	beforeEach(() => {
		useFormContext.mockReturnValue({
			setValue: mockSetValue,
			register: mockRegister,
		});
	});

	it("renders with required props", () => {
		render(
			<InputField
				id="firstName"
				label="First Name"
				register={mockRegister}
				errors={{}}
			/>
		);

		expect(screen.getByLabelText("First Name")).toBeInTheDocument();
	});

	it("displays error when empty", () => {
		useFormContext.mockReturnValue({
			setValue: mockSetValue,
			register: mockRegister,
			formState: {
				errors: {
					amount: { message: "Please enter your first name." },
				},
			},
		});

		render(
			<InputField
				id="firstName"
				label="First Name"
				register={mockRegister}
				errors={{
					firstName: { message: "Please enter your first name." },
				}}
			/>
		);

		expect(
			screen.getByText("Please enter your first name.")
		).toBeInTheDocument();
	});

	it("triggers onInput handler on input change", () => {
		const handleInput = jest.fn();
		render(
			<InputField
				id="firstName"
				label="First Name"
				register={mockRegister}
				onInput={handleInput}
				errors={{
					firstName: { message: "Please enter your first name." },
				}}
			/>
		);

		const input = screen.getByLabelText("First Name");
		fireEvent.input(input, { target: { value: "Name" } });
		expect(handleInput).toHaveBeenCalledWith(expect.any(Object));
	});

	it("displays the optional label if optional is true", () => {
		render(
			<InputField
				id="firstName"
				label="First Name"
				optional={true}
				register={mockRegister}
				errors={{}}
			/>
		);

		expect(screen.queryByText("Optional")).toBeInTheDocument();
	});

	it("displays the hidden class if hidden is true", () => {
		const { container } = render(
			<InputField
				id="firstName"
				label="First Name"
				optional={true}
				hidden={true}
				register={mockRegister}
				errors={{}}
			/>
		);

		expect(screen.getByLabelText("First Name")).toBeInTheDocument();
		expect(container.firstChild).toHaveClass("hidden");
	});

	it("contains a placeholder", () => {
		render(
			<InputField
				id="firstName"
				label="First Name"
				placeholder="Name"
				register={mockRegister}
				errors={{}}
			/>
		);

		expect(screen.getByPlaceholderText("Name").toBeInTheDocument);
	});

	it("contains a placeholder amount that reflects the default value", () => {
		render(
			<InputField
				id="firstName"
				label="First Name"
				placeholder="Name"
				defaultValue="Default"
				register={mockRegister}
				errors={{}}
			/>
		);

		expect(screen.getByPlaceholderText("Default").toBeInTheDocument);
	});
});
