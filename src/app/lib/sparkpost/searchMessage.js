/* 
SearchMessage.js
Searches sparkpost for a particular event through parameters
*/

const SparkPost = require("sparkpost");
const client = new SparkPost(process.env.SPARKPOST_API_KEY);

export default async function searchMessage(params = {}) {
	try {
		const searchMessageResult = await client.events.searchMessage(params);
		if (searchMessageResult) {
			return searchMessageResult;
		} else {
			throw new Error("failed to search for message");
		}
	} catch (error) {
		console.error(error);
	}
}
