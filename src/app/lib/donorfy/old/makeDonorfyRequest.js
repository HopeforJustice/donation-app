import { sanitiseForLogging } from "../../utilities";

export default async function makeDonorfyRequest(
	url,
	method,
	authString,
	data = null
) {
	const headers = {
		Authorization: `Basic ${authString}`,
		"Content-Type": "application/json",
	};

	const options = {
		method,
		headers,
	};

	if (data) {
		options.body = JSON.stringify(data);
	}

	console.log(
		"donorfy data to send: ",
		sanitiseForLogging(options.body ? options.body : "No data")
	);

	//timing
	const startTime = Date.now();

	const response = await fetch(url, options);

	const endTime = Date.now();

	console.log(`Request to ${url} took ${endTime - startTime} ms`);

	//Check if the response has a body
	let responseData;
	try {
		responseData = await response.json();
	} catch (error) {
		responseData = null; //assume no content
	}

	if (!response.ok) {
		throw new Error(
			`Donorfy request failed: ${
				responseData?.message || response.statusText
			}, url: ${url}, method: ${method}, data: ${JSON.stringify(
				data
			)}, response: ${JSON.stringify(responseData)}`
		);
	}

	return responseData ? responseData : "ok";
}
