export default function ProgressIndicator({ steps }) {
	return (
		<div aria-label="Progress" className="flex items-center justify-start mb-8">
			<ol role="list" className="flex items-center space-x-5">
				{steps.map((step) => (
					<li key={step.id}>
						{step.status === "complete" ? (
							<div className="block h-2.5 w-2.5 rounded-full bg-hfj-red">
								<span className="sr-only">{step.title}</span>
							</div>
						) : step.status === "current" ? (
							<div
								aria-current="step"
								className="relative flex items-center justify-center"
							>
								<span aria-hidden="true" className="absolute flex h-5 w-5 p-px">
									<span className="h-full w-full rounded-full bg-hfj-red-tint3" />
								</span>
								<span
									aria-hidden="true"
									className="relative block h-2.5 w-2.5 rounded-full bg-hfj-red"
								/>
								<span className="sr-only">{step.title}</span>
							</div>
						) : (
							<div className="block h-2.5 w-2.5 rounded-full bg-gray-200">
								<span className="sr-only">{step.title}</span>
							</div>
						)}
					</li>
				))}
			</ol>
		</div>
	);
}
