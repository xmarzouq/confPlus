import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

const users = require("/data/users.json");
const papers = require("/data/papers.json");

export default async function handler(req, res) {
	if (req.method === "POST") {
		const { title, abstract, authors, file } = req.body;
		const newPaper = {
			id: uuidv4(),
			title,
			abstract,
			authors,
			file: file,
			reviewers: assignReviewers(),
		};

		savePaper(newPaper);
		res.status(200).json({ message: "Paper submitted successfully!" });
	} else {
		res.status(405).json({ message: "Method not allowed." });
	}
}
//assigning the reviewers here after submission
function assignReviewers() {
	const reviewers = users.filter((user) => user.role === "reviewer");
	const assignedReviewers = [];
	for (let i = 0; i < 2; i++) {
		const randomIndex = Math.floor(Math.random() * reviewers.length);
		assignedReviewers.push(reviewers[randomIndex].id);
		reviewers.splice(randomIndex, 1);
	}
	return assignedReviewers;
}

function savePaper(paper) {
	papers.push(paper);
	const filePath = path.join(process.cwd(), "data", "papers.json");
	fs.writeFileSync(filePath, JSON.stringify(papers));
}
