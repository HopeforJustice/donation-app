const HorizontalRule = ({ className }) => {
	return (
		<div className={`relative ${className}`}>
			<div aria-hidden="true" className="inset-0 flex items-center">
				<div className="w-full border-t border-gray-300" />
			</div>
		</div>
	);
};

export default HorizontalRule;
