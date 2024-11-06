import React from "react";
import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import { useFormContext } from "react-hook-form";
// import { formSchema } from "@/app/lib/schema";
import AmountField from "@/app/ui/forms/fields/AmountField";

jest.mock("react-hook-form", () => ({
	useFormContext: jest.fn(),
}));

describe("AmountField component", () => {
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
			<AmountField
				id="amount"
				label="Donation Amount"
				currencySymbol="£"
				acceptedCurrencies={[{ value: "gbp", text: "GBP" }]}
				register={mockRegister}
				errors={{}}
			/>
		);

		expect(screen.getByLabelText("Donation Amount")).toBeInTheDocument();
		expect(screen.getByText("£")).toBeInTheDocument();
		expect(screen.getByText("GBP")).toBeInTheDocument();
	});

	it("displays error when amount is below minimum value", () => {
		useFormContext.mockReturnValue({
			setValue: mockSetValue,
			register: mockRegister,
			formState: {
				errors: {
					amount: { message: "Please enter an amount of 2 or higher." },
				},
			},
		});

		render(
			<AmountField
				id="amount"
				label="Donation Amount"
				currencySymbol="$"
				acceptedCurrencies={[{ value: "USD", text: "USD" }]}
				register={mockRegister}
				errors={{
					amount: { message: "Please enter an amount of 2 or higher." },
				}}
			/>
		);

		expect(
			screen.getByText("Please enter an amount of 2 or higher.")
		).toBeInTheDocument();
	});

	it("triggers onInput handler on input change", () => {
		const handleInput = jest.fn();
		render(
			<AmountField
				id="amount"
				label="Donation Amount"
				onInput={handleInput}
				currencySymbol="$"
				acceptedCurrencies={[{ value: "gbp", text: "GBP" }]}
				register={mockRegister}
				errors={{}}
				currency="gbp"
			/>
		);

		const input = screen.getByLabelText("Donation Amount");
		fireEvent.input(input, { target: { value: "50" } });
		expect(handleInput).toHaveBeenCalledWith(expect.any(Object), "gbp");
	});

	it("displays currency options in select", () => {
		render(
			<AmountField
				id="amount"
				label="Donation Amount"
				currencySymbol="$"
				acceptedCurrencies={[
					{ value: "gbp", text: "GBP" },
					{ value: "usd", text: "USD" },
				]}
				register={mockRegister}
				errors={{}}
				currency="usd"
			/>
		);

		const currencySelect = screen.getByLabelText("Currency");
		expect(currencySelect).toBeInTheDocument();
		expect(screen.getByRole("option", { name: "USD" })).toBeInTheDocument();
		expect(screen.getByRole("option", { name: "GBP" })).toBeInTheDocument();
	});

	it("calls setValue when currency is changed", () => {
		render(
			<AmountField
				id="amount"
				label="Donation Amount"
				currencySymbol="$"
				acceptedCurrencies={[
					{ value: "usd", text: "USD" },
					{ value: "gbp", text: "GBP" },
				]}
				register={mockRegister}
				errors={{}}
				currency="gbp"
			/>
		);

		const currencySelect = screen.getByLabelText("Currency");
		fireEvent.change(currencySelect, { target: { value: "usd" } });
		expect(mockSetValue).toHaveBeenCalledWith("currency", "usd");
	});

	it("displays the optional label if optional is true", () => {
		render(
			<AmountField
				id="amount"
				label="Donation Amount"
				optional={true}
				currencySymbol="£"
				acceptedCurrencies={[{ value: "gbp", text: "GBP" }]}
				register={mockRegister}
				errors={{}}
			/>
		);

		expect(screen.queryByText("Optional")).toBeInTheDocument();
	});

	it("contains the hidden class if hidden is true", () => {
		const { container } = render(
			<AmountField
				id="amount"
				label="Donation Amount"
				hidden={true}
				currencySymbol="£"
				acceptedCurrencies={[{ value: "gbp", text: "GBP" }]}
				register={mockRegister}
				errors={{}}
			/>
		);

		expect(screen.getByLabelText("Donation Amount")).toBeInTheDocument();
		expect(container.firstChild).toHaveClass("hidden");
	});

	it("contains a placeholder amount", () => {
		render(
			<AmountField
				id="amount"
				label="Donation Amount"
				hidden={true}
				currencySymbol="£"
				placeholder="0.00"
				acceptedCurrencies={[{ value: "gbp", text: "GBP" }]}
				register={mockRegister}
				errors={{}}
			/>
		);

		expect(screen.getByPlaceholderText("0.00").toBeInTheDocument);
	});

	it("contains a placeholder amount that reflects the default value", () => {
		render(
			<AmountField
				id="amount"
				label="Donation Amount"
				hidden={true}
				currencySymbol="£"
				placeholder="0.00"
				defaultValue="10.00"
				acceptedCurrencies={[{ value: "gbp", text: "GBP" }]}
				register={mockRegister}
				errors={{}}
			/>
		);

		expect(screen.getByPlaceholderText("10.00").toBeInTheDocument);
	});
});
