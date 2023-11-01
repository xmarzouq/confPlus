import institutions from "/data/institutions.json";

export default async function handler(req, res) {
	if (req.method === "GET") {
		res.status(200).json(institutions);
	} else {
		res.status(405).json({ message: "Method not allowed" });
	}
}
