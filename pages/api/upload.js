const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadDir = path.join(process.cwd(), "public", "uploads");

// Check if upload directory exists, if not, create it
if (!fs.existsSync(uploadDir)) {
	fs.mkdirSync(uploadDir, { recursive: true });
}

// Set up multer storage engine
const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, uploadDir);
	},
	filename: function (req, file, cb) {
		const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
		cb(
			null,
			file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
		);
	},
});

// Create multer middleware
const upload = multer({ storage });

// Define the endpoint handler
function handler(req, res) {
	if (req.method === "POST") {
		// console.log("Content-Type:", req.headers["content-type"]);
		console.log("Request body size:", req.headers["content-length"]);

		upload.single("file")(req, res, (err) => {
			if (err) {
				if (err.code === "LIMIT_FILE_SIZE") {
					res.status(400).json({ message: "File size exceeds the limit" });
				} else {
					console.error(err);
					res
						.status(500)
						.json({ message: "Error uploading file", error: err.message });
				}
			} else {
				console.log("Uploaded file:", req.file);
				res.status(200).json({
					message: "File uploaded successfully",
					filename: req.file.filename,
				});
			}
		});
	} else {
		res.status(405).json({ message: "Method not allowed" });
	}
}

module.exports = handler;
