import fs from "fs";
import path from "path";
import papers from "/data/papers.json";

export default async function handler(req, res) {
	if (req.method === "POST") {
		const { paperId } = req.query;
		const reviewData = req.body;

		const paperIndex = papers.findIndex((paper) => paper.id === paperId);

		if (paperIndex === -1) {
			res.status(404).json({ message: "Paper not found" });
			return;
		}

		papers[paperIndex].reviews = papers[paperIndex].reviews || [];
		papers[paperIndex].reviews.push(reviewData);

		savePapers(papers);
		res.status(200).json({ message: "Review submitted successfully!" });
	} else {
		res.status(405).json({ message: "Method not allowed." });
	}
}

function savePapers(papers) {
	const filePath = path.join(process.cwd(), "data", "papers.json");
	fs.writeFileSync(filePath, JSON.stringify(papers));
}
