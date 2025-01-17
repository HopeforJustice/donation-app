import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { useFormContext } from "react-hook-form";

import AddressSearchLoqate from "@/app/ui/forms/fields/AddressSearchLoqate";

jest.mock("react-hook-form", () => ({
	useFormContext: jest.fn(),
}));

jest.mock("react-loqate", () => ({
	__esModule: true, // Ensures ES module compatibility
	default: ({ components: { Input, List }, onSelect }) => (
		<div>
			<Input data-testid="address-input" />
			<List>
				<li
					data-testid="address-item"
					onClick={() =>
						onSelect({
							Line1: "123 Mock Street",
							Line2: "Mock Area",
							PostalCode: "MO12 3CK",
							CountryName: "Mockland",
							City: "Mock City",
							ProvinceName: "Mock County",
						})
					}
				>
					Mock Address
				</li>
			</List>
		</div>
	),
}));

describe("AddressSearchLoqate Component", () => {
	beforeEach(() => {
		useFormContext.mockReturnValue({
			setValue: jest.fn(),
		});
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	it("renders the component with the correct label and optional text", () => {
		render(
			<AddressSearchLoqate
				id="test-address"
				label="Address"
				optional={true}
				extraClasses="custom-class"
			/>
		);

		expect(screen.getByText("Address")).toBeInTheDocument();
		expect(screen.getByText("Optional")).toBeInTheDocument();
		expect(screen.getByTestId("address-search")).toBeInTheDocument();
	});

	it("calls setValue with correct address fields when an address is selected", () => {
		const setValueMock = jest.fn();
		useFormContext.mockReturnValueOnce({
			setValue: setValueMock,
		});

		render(<AddressSearchLoqate id="test-address" label="Address" />);

		fireEvent.click(screen.getByTestId("address-item"));

		expect(setValueMock).toHaveBeenCalledWith("address1", "123 Mock Street");
		expect(setValueMock).toHaveBeenCalledWith("address2", "Mock Area");
		expect(setValueMock).toHaveBeenCalledWith("postcode", "MO12 3CK");
		expect(setValueMock).toHaveBeenCalledWith("country", "Mockland");
		expect(setValueMock).toHaveBeenCalledWith("townCity", "Mock City");
		expect(setValueMock).toHaveBeenCalledWith("stateCounty", "Mock County");
	});
});
