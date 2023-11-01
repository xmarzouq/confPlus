import conferenceDates from "/data/conference-dates.json";

export default async function handler(req, res) {
	if (req.method === "GET") {
		res.status(200).json(conferenceDates);
	} else {
		res.status(405).json({ message: "Method not allowed" });
	}
}
