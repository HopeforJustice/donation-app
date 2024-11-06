import React from "react";
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import Container from "@/app/ui/layout/containers/Container";

describe("Container component", () => {
	it("renders with default container classes", () => {
		render(<Container>Container Content</Container>);
		const container = screen.getByText("Container Content");

		// Check for default classes
		expect(container).toHaveClass("container");
		expect(container).toHaveClass("mx-auto");
		expect(container).toHaveClass("sm:px-6");
		expect(container).toHaveClass("lg:px-8");
	});

	it("applies additional classes from `className` prop", () => {
		render(<Container className="custom-class">Container Content</Container>);
		const container = screen.getByText("Container Content");

		// Check for custom class in addition to the default classes
		expect(container).toHaveClass("custom-class");
		expect(container).toHaveClass("container"); // Default class should still be present
	});

	it("renders children inside the container", () => {
		render(
			<Container>
				<span>Child 1</span>
				<span>Child 2</span>
			</Container>
		);

		// Ensure children are rendered inside the container
		expect(screen.getByText("Child 1")).toBeInTheDocument();
		expect(screen.getByText("Child 2")).toBeInTheDocument();
	});
});
