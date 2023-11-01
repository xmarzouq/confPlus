import locations from "/data/locations.json";

export default async function handler(req, res) {
	if (req.method === "GET") {
		res.status(200).json(locations);
	} else {
		res.status(405).json({ message: "Method not allowed" });
	}
}
