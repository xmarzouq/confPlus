const express = require("express");
const next = require("next");
const path = require("path");

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

// Import the upload route
const uploadHandler = require("./pages/api/upload");

app
	.prepare()
	.then(() => {
		const server = express();

		// Add this line to serve the data directory
		server.use("/data", express.static(path.join(__dirname, "data")));

		// Register the upload route
		server.post("/api/upload", uploadHandler);

		server.all("*", (req, res) => {
			return handle(req, res);
		});

		const port = process.env.PORT || 3000;

		server.listen(port, (err) => {
			if (err) throw err;
			console.log(`> Ready on http://localhost:${port}`);
		});
	})
	.catch((ex) => {
		console.error(ex.stack);
		process.exit(1);
	});
