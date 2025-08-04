import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import Button from "@/app/ui/buttons/Button";

describe("Button component", () => {
	it("renders button with default props", () => {
		render(<Button text="Click me" />);

		const button = screen.getByRole("button", { name: "Click me" });
		expect(button).toBeInTheDocument();
		expect(button).toHaveClass(
			"rounded-md shadow-sm px-2.5 py-1.5 pt-2 text-sm font-semibold bg-hfj-red text-white"
		);
	});

	it("applies size 'large' and buttonType 'secondary'", () => {
		render(<Button text="Large Button" size="large" buttonType="secondary" />);

		const button = screen.getByRole("button", { name: "Large Button" });
		expect(button).toBeInTheDocument();
		expect(button).toHaveClass(
			"px-3 py-2 pt-2.5 bg-white text-hfj-black ring-gray-300"
		);
	});

	it("triggers onClick handler when clicked", () => {
		const handleClick = jest.fn();
		render(<Button text="Click me" onClick={handleClick} />);

		const button = screen.getByRole("button", { name: "Click me" });
		fireEvent.click(button);
		expect(handleClick).toHaveBeenCalledTimes(1);
	});

	it("is disabled and does not trigger onClick handler when clicked", () => {
		const handleClick = jest.fn();
		render(<Button text="Click me" onClick={handleClick} disabled={true} />);

		const button = screen.getByRole("button", { name: "Click me" });
		expect(button).toBeInTheDocument();
		expect(button).toBeDisabled();
		fireEvent.click(button);
		expect(handleClick).toHaveBeenCalledTimes(0);
	});

	it("applies extraClasses prop", () => {
		render(<Button text="Styled Button" extraClasses="custom-class" />);

		const button = screen.getByRole("button", { name: "Styled Button" });
		expect(button).toHaveClass("custom-class");
	});

	it("renders with size 'small'", () => {
		render(<Button text="Small Button" size="small" />);

		const button = screen.getByRole("button", { name: "Small Button" });
		expect(button).toHaveClass("px-2 py-1 pt-1.5 text-xs font-normal");
	});
});
