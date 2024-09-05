import React from "react";
import clsx from "clsx";

const Button = ({
	size = "default",
	text,
	onClick,
	buttonType = "primary",
	extraClasses = "",
}) => {
	return (
		<button
			onClick={onClick}
			type="button"
			className={clsx(
				`rounded-md shadow-sm ${extraClasses}`,
				size === "small"
					? "px-2 py-1 pt-1.5 text-xs font-normal"
					: "text-sm font-semibold",
				size === "medium" ? "px-2 py-1 pt-1.5" : "",
				size === "default" ? "px-2.5 py-1.5 pt-2" : "",
				size === "large" ? "px-3 py-2 pt-2.5" : "",
				size === "extraLarge" ? "px-3.5 py-2.5 pt-3" : "",
				buttonType === "secondary"
					? "bg-white hover:bg-gray-50 text-hfj-black ring-gray-300 ring-1 ring-inset"
					: "bg-hfj-red hover:bg-hfj-red-tint1 text-white"
			)}
		>
			{text}
		</button>
	);
};

export default Button;
