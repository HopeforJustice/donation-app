import crypto from "crypto";

export default function getSubscriberHash(email) {
	return crypto.createHash("md5").update(email.toLowerCase()).digest("hex");
}
