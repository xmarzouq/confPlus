import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const scheduleFile = path.join(__dirname, "..", "..", "data", "schedule.json");

export default async function handler(req, res) {
	if (req.method === "GET") {
		try {
			const { dateId } = req.query;
			const data = fs.readFileSync(scheduleFile, "utf8");
			const parsedData = JSON.parse(data);

			if (dateId) {
				const filteredData = parsedData.filter(
					(scheduleItem) => scheduleItem.date === dateId
				);
				res.status(200).json(filteredData);
			} else {
				res.status(200).json(parsedData);
			}
		} catch (err) {
			res.status(500).json({ message: "Error reading schedule data." });
		}
	} else if (req.method === "POST") {
		try {
			const newSchedule = req.body;

			// Read the existing data from the file
			const data = JSON.parse(fs.readFileSync(scheduleFile, "utf8"));

			// Append the new schedule object to the existing data
			data.push(newSchedule);

			// Write the updated data back to the file
			fs.writeFileSync(scheduleFile, JSON.stringify(data), "utf8");
			res.status(200).json({ message: "Schedule data saved successfully." });
			console.log(req.body);
		} catch (err) {
			console.error("Error details:", err);
			res.status(500).json({ message: "Error saving schedule data." });
		}
	} else if (req.method === "PUT") {
		try {
			const { sessionId, id: scheduleId } = req.query;
			const updatedData = req.body;
			const data = JSON.parse(fs.readFileSync(scheduleFile, "utf8"));

			const scheduleIndex = data.findIndex(
				(schedule) => schedule.id === scheduleId
			);

			if (scheduleIndex === -1) {
				res.status(404).json({ message: "Schedule not found." });
			} else {
				if (sessionId) {
					const sessionIndex = data[scheduleIndex].sessions.findIndex(
						(session) => session.id === sessionId
					);

					if (sessionIndex === -1) {
						res.status(404).json({ message: "Session not found." });
					} else {
						data[scheduleIndex].sessions[sessionIndex] = updatedData;
						fs.writeFileSync(scheduleFile, JSON.stringify(data), "utf8");
						res.status(200).json({ message: "Session updated successfully." });
					}
				} else {
					data[scheduleIndex] = updatedData;
					fs.writeFileSync(scheduleFile, JSON.stringify(data), "utf8");
					res.status(200).json({ message: "Schedule updated successfully." });
				}
			}
		} catch (err) {
			console.error("Error details:", err);
			res.status(500).json({ message: "Error updating data." });
		}
	} else if (req.method === "DELETE") {
		try {
			const { sessionId } = req.query;
			const data = JSON.parse(fs.readFileSync(scheduleFile, "utf8"));

			const scheduleIndex = data.findIndex((schedule) =>
				schedule.sessions.some((session) => session.id === sessionId)
			);

			if (scheduleIndex === -1) {
				res.status(404).json({ message: "Session not found." });
			} else {
				const sessionIndex = data[scheduleIndex].sessions.findIndex(
					(session) => session.id === sessionId
				);
				data[scheduleIndex].sessions.splice(sessionIndex, 1);
				fs.writeFileSync(scheduleFile, JSON.stringify(data), "utf8");
				res.status(200).json({ message: "Session deleted successfully." });
			}
		} catch (err) {
			console.error("Error details:", err);
			res.status(500).json({ message: "Error deleting session." });
		}
	} else {
		res.status(405).json({ message: "Method not allowed" });
	}
}
