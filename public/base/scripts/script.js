// === === === === === === === === === ==>(Use case 1)<== === === === === ===  === === === ===
async function displayPage(url) {
	const mainArea = document.querySelector("main");
	const fetchedPage = await fetch(url);
	const pageContent = await fetchedPage.text();
	mainArea.innerHTML = pageContent;
}

async function showLogin() {
	displayPage("login.html");
	document.getElementById("tag").style.display = "none";
	document.getElementById("rss").style.display = "none";
}

async function fetchUsersInfo() {
	const response = await fetch("/data/users.json");
	const usersInfo = await response.json();
	return usersInfo;
}
async function validateLogin(emailInput, passwordInput) {
	const usersInfo = await fetchUsersInfo();
	const foundUser = usersInfo.find(
		(user) => user.email === emailInput && user.password === passwordInput
	);

	if (foundUser) {
		document.getElementById("tag").style.display = "block";

		switch (foundUser.role) {
			case "author":
				displayPage("submit_paper.html").then(() => {
					initializeSubmitPaperListeners();
				});
				break;
			case "reviewer":
				displayPage("review_papers.html").then(async () => {
					const assignedPapers = await fetchAssignedPapers(foundUser.id);
					displayAssignedPapers(assignedPapers);
					document
						.getElementById("main")
						.addEventListener("submit", (event) => {
							if (event.target.id === "reviewForm") {
								event.preventDefault();
								submitReview(event);
							}
						});
				});
				break;

			case "organizer":
				displayPage("schedule_editor.html").then(() => {
					initScheduleEditor();
				});
				break;
			default:
				alert("Invalid role. Please check your data.");
		}
	} else {
		alert("Invalid email or password. Please try again.");
	}
}

document.addEventListener("DOMContentLoaded", () => {
	const loginLink = document.getElementById("login-link");
	const main = document.getElementById("main");
	if (loginLink && main) {
		loginLink.addEventListener("click", (event) => {
			event.preventDefault();
			showLogin();
		});

		main.addEventListener("submit", (event) => {
			if (event.target.id === "login-form") {
				event.preventDefault();
				const userEmail = document.getElementById("email").value;
				const userPassword = document.getElementById("password").value;
				validateLogin(userEmail, userPassword);
			}
		});
	}
	loadConferenceSchedule();
	initializeSubmitPaperListeners();
});

// === === === === === === === === === === === === === === === === === === === === === === ===
// === === === === === === === === === ==>(Use case 2)<== === === === === ===  === === === ===
function initializeSubmitPaperListeners() {
	if (document.getElementById("addAuthor")) {
		document.getElementById("addAuthor").addEventListener("click", addAuthor);
	}
	if (document.getElementById("paperForm")) {
		document
			.getElementById("paperForm")
			.addEventListener("submit", submitPaper);
	}
	if (document.getElementById("authors")) {
		addAuthor();
	}
}
function addAuthor() {
	const authorElement = document.createElement("div");
	authorElement.classList.add("author");
	authorElement.innerHTML = `
    <label>First Name</label>
    <input type="text" name="firstName" required>
    <label>Last Name</label>
    <input type="text" name="lastName" required>
    <label>Email</label>
    <input type="email" name="email" required>
    <label>Affiliation</label>
    <select name="affiliation" required></select>
    <label>Presenter</label>
    <input type="radio" name="presenter" value="true">
    <button type="button" onclick="removeAuthor(this)" class="btns" id="removeAuthorBtn">Remove</button>
  `;

	document.getElementById("authors").appendChild(authorElement);

	const affiliationSelect = authorElement.querySelector(
		"select[name='affiliation']"
	);
	populateInstitutionSelect(affiliationSelect);
}

function removeAuthor(buttonElement) {
	buttonElement.parentElement.remove();
}

// //assigning the reviewers here after submission
// function assignReviewers() {
// 	const reviewers = users.filter((user) => user.role === "reviewer");
// 	const assignedReviewers = [];
// 	for (let i = 0; i < 2; i++) {
// 		const randomIndex = Math.floor(Math.random() * reviewers.length);
// 		assignedReviewers.push(reviewers[randomIndex].id);
// 		reviewers.splice(randomIndex, 1);
// 	}
// 	return assignedReviewers;
// }

async function submitPaper(event) {
	event.preventDefault();

	const form = event.target;

	const paperFile = form.paperFile.files[0];
	const formData = new FormData();
	formData.append("file", paperFile);

	console.log("Paper File:", paperFile);
	console.log("FormData:", formData);

	// Upload the paper PDF to the server
	const uploadResponse = await fetch("/api/upload", {
		method: "POST",
		body: formData,
	});

	if (!uploadResponse.ok) {
		const error = await uploadResponse.json();
		console.error("Error Response:", error);
		alert("Error uploading paper file.");
		return;
	}
	const authors = Array.from(form.querySelectorAll(".author")).map(
		(authorElement) => {
			return {
				firstName: authorElement.querySelector("input[name='firstName']").value,
				lastName: authorElement.querySelector("input[name='lastName']").value,
				email: authorElement.querySelector("input[name='email']").value,
				affiliation: authorElement.querySelector("select[name='affiliation']")
					.value,
				isPresenter: authorElement.querySelector("input[name='presenter']")
					.checked,
			};
		}
	);
	const uploadedFile = await uploadResponse.json();
	console.log("File:", uploadedFile.filename);
	const paperData = {
		title: form.title.value,
		abstract: form.abstract.value,
		authors,
		file: uploadedFile.filename, // Add the file name here
	};
	// Submit the paper details to the server
	const submitResponse = await fetch("/api/submitPaper", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(paperData),
	});

	if (submitResponse.ok) {
		alert("Paper submitted successfully!");
		form.reset();
	} else {
		alert("Error submitting paper.");
	}
}

async function fetchInstitutions() {
	const response = await fetch("/data/institutions.json");
	const institutions = await response.json();
	return institutions;
}
async function populateInstitutionSelect(selectElement) {
	const institutions = await fetchInstitutions();
	institutions.forEach((institution) => {
		const option = document.createElement("option");
		option.value = institution.id;
		option.textContent = institution.name;
		selectElement.appendChild(option);
	});
}

// === === === === === === === === === === === === === === === === === === === === === === ===
// === === === === === === === === === ==>(Use case 3)<== === === === === ===  === === === ===

async function fetchAssignedPapers(reviewerId) {
	const response = await fetch("/data/papers.json");
	const papers = await response.json();
	const assignedPapers = papers.filter((paper) =>
		paper.reviewers.includes(reviewerId)
	);
	return assignedPapers;
}

function displayAssignedPapers(papers) {
	const papersList = document.getElementById("assigned-papers");
	papersList.innerHTML = "";

	papers.forEach((paper) => {
		const listItem = document.createElement("div");
		listItem.classList.add("paper-sep-card");
		listItem.innerHTML = `
		<input type="radio" name="selected-paper" value="${paper.id}">
		<h3>${paper.title}</h3>
		<p>
			<button class="toggle-abstract">Toggle Abstract</button>
			<span class="abstract" style="display: none;">${paper.abstract}</span>
		</p>
		<p><strong>Authors:</strong> ${paper.authors
			.map((author) => `${author.firstName} ${author.lastName}`)
			.join(", ")}</p>
		<a href="/uploads/${paper.file}" target="_blank">Download Paper</a>

		<button class="review-paper" data-paper-id="${paper.id}">Review Paper</button>
		`;

		listItem
			.querySelector(".toggle-abstract")
			.addEventListener("click", function () {
				const abstractElement = this.nextElementSibling;
				abstractElement.style.display =
					abstractElement.style.display === "none" ? "inline" : "none";
			});

		listItem
			.querySelector(".review-paper")
			.addEventListener("click", function () {
				const paperId = this.getAttribute("data-paper-id");
				const paperFile = paper.file;
				displayPdfModal(paperFile);
			});

		papersList.appendChild(listItem);
	});
}

function displayPdfModal(paperFile) {
	// Create a modal to display the PDF
	const modal = document.createElement("div");
	modal.classList.add("pdf-modal");
	modal.innerHTML = `
		<div class="pdf-modal-content">
			<span class="pdf-modal-close">&times;</span>
			<iframe src="/uploads/${paperFile}" width="100%" height="600px"></iframe>
		</div>
	`;
	document.body.appendChild(modal);

	// Close the modal when the 'X' button is clicked
	const closeButton = document.querySelector(".pdf-modal-close");
	closeButton.addEventListener("click", () => {
		modal.remove();
	});
}
async function submitReview(event) {
	event.preventDefault();
	const form = event.target;

	// Get the selected paper ID
	const selectedPaperRadio = document.querySelector(
		"input[name='selected-paper']:checked"
	);
	if (!selectedPaperRadio) {
		alert("Please select a paper to review.");
		return;
	}
	const paperId = selectedPaperRadio.value;
	const reviewData = {
		overallEvaluation: form.overallEvaluation.value,
		paperContribution: form.paperContribution.value,
		paperStrengths: form.paperStrengths.value,
		paperWeaknesses: form.paperWeaknesses.value,
	};

	const response = await fetch(`/api/submitReview/${paperId}`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(reviewData),
	});

	if (response.ok) {
		alert("Review submitted successfully!");
		form.reset();
	} else {
		alert("Error submitting review.");
	}
}

// === === === === === === === === === === === === === === === === === === === === === === ===
// === === === === === === === === === ==>(Use case 4)<== === === === === ===  === === === ===
async function getAcceptedPapers() {
	const response = await fetch("/data/papers.json");
	const papers = await response.json();
	return papers.filter((paper) => {
		const totalEvaluation = paper.reviews.reduce(
			(sum, review) => sum + review.overallEvaluation,
			0
		);
		return totalEvaluation >= 2;
	});
}

async function getLocations() {
	const response = await fetch("/api/locations");
	const locations = await response.json();
	return locations;
}
async function getConferenceDates() {
	const response = await fetch("/api/conference-dates");
	const conferenceDates = await response.json();
	return conferenceDates;
}
async function getSchedule() {
	const response = await fetch("/api/schedule");
	return await response.json();
}
function populateDropdown(elementId, items) {
	const dropdown = document.getElementById(elementId);
	items.forEach((item) => {
		const option = document.createElement("option");
		option.value = item.id;
		if (elementId === "papers-dropdown") {
			option.innerText = item.title; // Set the innerText to item.title for accepted-papers
		} else {
			option.innerText = item.name || item.title || item.date;
		}
		dropdown.appendChild(option);
	});
}

async function initScheduleEditor() {
	const acceptedPapers = await getAcceptedPapers();
	const locations = await getLocations();
	const conferenceDates = await getConferenceDates();
	const schedule = await getSchedule();

	console.log("Accepted papers:", acceptedPapers);
	console.log("Locations:", locations);
	console.log("Conference dates:", conferenceDates);

	populateDropdown("papers-dropdown", acceptedPapers);
	populateDropdown("location-dropdown", locations);
	populateDropdown("date-dropdown", conferenceDates);
	// populateDropdown(
	// 	"schedule-dropdown",
	// 	schedule.map((s) => ({ id: s.id, name: `${s.location.name} - ${s.date}` }))
	// );
	populateDropdown("schedule-dropdown", schedule);

	document.getElementById("new-schedule").style.display = "block";
	document.getElementById("schedules").innerHTML = "";
	document.getElementById("sessions").style.display = "none";
	document.getElementById("add-session").style.display = "block";

	const scheduleDropdown = document.getElementById("schedule-dropdown");
	scheduleDropdown.addEventListener("change", () => {
		const selectedIndex = scheduleDropdown.selectedIndex;
		const newScheduleDiv = document.getElementById("new-schedule");
		const schedulesDiv = document.getElementById("schedules");
		const sessionsDiv = document.getElementById("sessions");

		if (selectedIndex === 0) {
			newScheduleDiv.style.display = "block";
			schedulesDiv.innerHTML = "";
			sessionsDiv.style.display = "none";
			document.getElementById("add-session").style.display = "block"; // Hide the add session button when creating a new schedule
		} else {
			newScheduleDiv.style.display = "none";
			displaySelectedSchedule(schedule[selectedIndex - 1], schedulesDiv);
			sessionsDiv.style.display = "block";
			document.getElementById("add-session").style.display = "block";
			updateSessionsDropdown(schedule, locations);
		}
	});

	const sessionDropdown = document.getElementById("session-dropdown");
	sessionDropdown.addEventListener("change", () => {
		const selectedIndex = sessionDropdown.selectedIndex;
		const sessionBtnsDiv = document.getElementById("sessionBtns");

		if (selectedIndex === 0) {
			sessionBtnsDiv.style.display = "none";
		} else {
			sessionBtnsDiv.style.display = "block";
		}
	});

	const addSessionBtn = document.getElementById("add-session");
	addSessionBtn.addEventListener("click", async () => {
		const sessionForm = document.getElementById("session-form");
		sessionForm.style.display = "block";
		sessionForm.dataset.mode = "add";

		const selectedPaperIndex =
			document.getElementById("papers-dropdown").selectedIndex;
		const selectedLocationIndex =
			document.getElementById("location-dropdown").selectedIndex;
		const selectedDateIndex =
			document.getElementById("date-dropdown").selectedIndex;
		const selectedScheduleIndex =
			document.getElementById("schedule-dropdown").selectedIndex - 1;

		if (selectedScheduleIndex >= 0) {
			const selectedPaper = acceptedPapers[selectedPaperIndex];
			const selectedLocation = locations[selectedLocationIndex];
			const selectedDate = conferenceDates[selectedDateIndex].date;

			addSession(
				selectedPaper,
				selectedLocation,
				selectedDate,
				schedule[selectedScheduleIndex]
			);
		}
	});
	const editSessionBtn = document.getElementById("edit-session-button");
	editSessionBtn.addEventListener("click", () => {
		const sessionForm = document.getElementById("session-form");
		sessionForm.style.display = "block";
		sessionForm.dataset.mode = "edit";

		// Fill the form with the selected session data
		const selectedSessionId = sessionDropdown.value;
		const selectedScheduleIndex = scheduleDropdown.selectedIndex - 1;
		const selectedSession = schedule[selectedScheduleIndex].sessions.find(
			(session) => session.id === selectedSessionId
		);
		if (selectedSession) {
			document.getElementById("session-title-input").value =
				selectedSession.title;
			document.getElementById("location-dropdown").value =
				selectedSession.location;
			document.getElementById("date-dropdown").value = selectedSession.date;

			const papersDropdown = document.getElementById("papers-dropdown");
			selectedSession.papers.forEach((paper) => {
				const optionIndex = Array.from(papersDropdown.options).findIndex(
					(option) => option.value === paper.id
				);
				if (optionIndex !== -1) {
					// Add this condition
					papersDropdown.options[optionIndex].selected = true;
				}
			});

			document.getElementById("from-time-input").value =
				selectedSession.papers[0].from_time;
			document.getElementById("to-time-input").value =
				selectedSession.papers[0].to_time;
		}
	});

	const updateSessionBtn = document.getElementById("update-session-button");
	updateSessionBtn.addEventListener("click", async (event) => {
		event.preventDefault();
		try {
			const sessionForm = document.getElementById("session-form");
			const mode = sessionForm.dataset.mode;

			const title = document.getElementById("session-title-input").value;
			const locationId = document.getElementById("location-dropdown").value;
			const date = document.getElementById("date-dropdown").value;
			const paperIds = Array.from(
				document.getElementById("papers-dropdown").selectedOptions
			).map((option) => option.value);
			const fromTime = document.getElementById("from-time-input").value;
			const toTime = document.getElementById("to-time-input").value;

			const selectedScheduleIndex = scheduleDropdown.selectedIndex - 1;
			const newScheduleName =
				document.getElementById("new-schedule-name").value;
			const newSession = {
				id: mode === "add" ? generateId() : sessionDropdown.value,
				title,
				location: locationId,
				date,
				papers: paperIds.map((paperId) => ({
					id: paperId,
					from_time: fromTime,
					to_time: toTime,
				})),
			};
			if (mode === "add") {
				if (selectedScheduleIndex === -1) {
					// New schedule
					const newSchedule = {
						id: generateId(),
						title: newScheduleName,
						location: {
							id: locationId,
							name: locations.find((loc) => loc.id === locationId)?.name || "",
						},
						date,
						sessions: [newSession],
					};
					schedule.push(newSchedule);
					await fetch("/api/schedule", {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify(newSchedule),
					});
				} else {
					// Add session to existing schedule
					schedule[selectedScheduleIndex].sessions.push(newSession);
					await fetch(
						`/api/schedule?id=${schedule[selectedScheduleIndex].id}`,
						{
							method: "PUT",
							headers: { "Content-Type": "application/json" },
							body: JSON.stringify(schedule[selectedScheduleIndex]),
						}
					);
				}
			} else if (mode === "edit") {
				const sessionIndex = schedule[selectedScheduleIndex].sessions.findIndex(
					(session) => session.id === newSession.id
				);
				schedule[selectedScheduleIndex].sessions[sessionIndex] = newSession;
				await fetch(
					`/api/schedule?id=${schedule[selectedScheduleIndex].id}&sessionId=${newSession.id}`,
					{
						method: "PUT",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify(newSession),
					}
				);
			}
			sessionForm.style.display = "none";
			sessionForm.reset();
			updateSessionsDropdown(schedule, locations);
			alert("Session updated successfully.");
		} catch (error) {
			console.error(error);
			alert("Error updating session. Please try again.");
		}
		displayPage("schedule_editor.html").then(() => {
			initScheduleEditor();
		});
	});

	async function deleteSession(sessionId, schedule) {
		// Remove the session from the schedule object
		const sessionIndex = schedule.sessions.findIndex(
			(session) => session.id === sessionId
		);
		if (sessionIndex !== -1) {
			schedule.sessions.splice(sessionIndex, 1);
		}

		const response = await fetch(`/api/schedule?sessionId=${sessionId}`, {
			method: "DELETE",
		});

		if (!response.ok) {
			throw new Error("Error deleting session.");
		}
		displayPage("schedule_editor.html").then(() => {
			initScheduleEditor();
		});
	}

	const deleteSessionBtn = document.getElementById("delete-session-button");
	deleteSessionBtn.addEventListener("click", async () => {
		try {
			const selectedSessionId = sessionDropdown.value;
			const selectedScheduleIndex =
				document.getElementById("schedule-dropdown").selectedIndex - 1; // Define the variable here
			await deleteSession(
				selectedSessionId,
				schedule[selectedScheduleIndex]
				// schedule[selectedScheduleIndex].sessions
			);
			updateSessionsDropdown(schedule, locations);
			displaySessions(schedule[selectedScheduleIndex].sessions);
			alert("Session deleted successfully.");
		} catch (error) {
			console.error(error);
			alert("Error deleting session. Please try again.");
		}
	});
}
function updateSessionsDropdown(schedule, locations) {
	const sessionDropdown = document.getElementById("session-dropdown");
	const selectedScheduleIndex =
		document.getElementById("schedule-dropdown").selectedIndex - 1;

	// Clear existing options
	sessionDropdown.innerHTML = "";

	// Add the "SELECT A SESSION" option as the first option
	const selectOption = document.createElement("option");
	selectOption.value = "";
	selectOption.innerText = "SELECT A SESSION";
	sessionDropdown.appendChild(selectOption);

	if (selectedScheduleIndex >= 0) {
		const sessions = schedule[selectedScheduleIndex]?.sessions || [];
		sessions.forEach((session) => {
			const option = document.createElement("option");
			option.value = session.id;
			option.innerText = session.title;
			sessionDropdown.appendChild(option);
		});
	}
}

function generateId() {
	return Math.random().toString(36).substr(2, 9);
}

function addSession(selectedPaper, selectedLocation, selectedDate, schedule) {
	if (!selectedPaper) {
		console.error("Error: selectedPaper is undefined");
		return;
	}

	const newSession = {
		id: generateId(),
		paperId: selectedPaper.id,
		locationId: selectedLocation.id,
		date: selectedDate,
	};

	schedule.push(newSession);
	saveSchedule(schedule);
	displaySelectedSchedule(schedule, document.getElementById("schedules"));
}

function displaySelectedSchedule(selectedSchedule, schedulesDiv) {
	schedulesDiv.innerHTML = "";
	schedulesDiv.innerHTML = `
    <h2>${selectedSchedule.location.name}</h2>
    <p>${selectedSchedule.date}</p>
    <ul>
      ${selectedSchedule.sessions
				.map(
					(session) =>
						`<li>
          <h3>${session.title}</h3>
          <p>Location: ${selectedSchedule.location.name}</p>
          <p>Date: ${selectedSchedule.date}</p>
          <ul>
            ${session.papers
							.map(
								(paper) =>
									`<li>
              <p>From: ${paper.from_time} To: ${paper.to_time}</p>
            </li>`
							)
							.join("")}
          </ul>
        </li>`
				)
				.join("")}
    </ul>
  `;
}
function displaySessions(sessions) {
	const sessionsDiv = document.getElementById("sessions");
	sessionsDiv.innerHTML = "";
	sessions.forEach((session) => {
		const sessionElement = document.createElement("div");
		sessionElement.innerHTML = `
      <h3>${session.title}</h3>
      <p>Location: ${session.location}</p>
      <p>Date: ${session.date}</p>
      <p>Time: ${session.papers[0].from_time} - ${session.papers[0].to_time}</p>
    `;
		sessionsDiv.appendChild(sessionElement);
	});
}

async function saveSchedule(schedule) {
	const response = await fetch("/api/schedule", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(schedule),
	});
	if (!response.ok) {
		alert("Error saving schedule. Please try again.");
	}
}
// === === === === === === === === === === === === === === === === === === === === === === ===
// === === === === === === === === === === Use Case 5 === === === === === === === === === ===

async function fetchConferenceDates(callback) {
	const response = await fetch("/api/conference-dates");
	const dates = await response.json();
	callback(dates);
}

async function fetchConferenceSchedule(callback) {
	const response = await fetch("/api/schedule");
	const schedule = await response.json();
	callback(schedule);
}

function populateConferenceSchedule(schedule) {
	const scheduleContainer = document.getElementById("schedule-container");
	const scheduleList = document.createElement("ul");
	scheduleList.id = "schedule-list";
	schedule.forEach((scheduleItem) => {
		const listItem = document.createElement("li");
		listItem.innerHTML = `<h3>${scheduleItem.title}</h3>
      <p>Date: ${scheduleItem.date} - Location: ${
			scheduleItem.location.name
		}</p>
      <ul>
        ${scheduleItem.sessions
					.map(
						(session) => `
          <li>
            <h4>${session.title}</h4>
            <p>Time: ${session.papers[0].from_time} - ${session.papers[0].to_time}</p>
          </li>`
					)
					.join("")}
      </ul>`;
		scheduleList.appendChild(listItem);
	});

	scheduleContainer.innerHTML = "";
	scheduleContainer.appendChild(scheduleList);
}

async function filterScheduleByDate() {
	const dateDropdown = document.getElementById("dates-dropdown");
	const selectedDateId = dateDropdown.value;
	const response = await fetch(`/api/schedule?dateId=${selectedDateId}`);
	const filteredSchedule = await response.json();
	populateConferenceSchedule(filteredSchedule);
}

function attachFilterListener() {
	const dateDropdown = document.getElementById("dates-dropdown");
	dateDropdown.addEventListener("change", filterScheduleByDate);
}

async function loadConferenceSchedule() {
	const dateDropdown = document.getElementById("dates-dropdown");
	const scheduleContainer = document.getElementById("schedule-container");

	// Load the conference dates into the dropdown
	const conferenceDates = await getConferenceDates();
	conferenceDates.forEach((dateObj) => {
		const option = document.createElement("option");
		option.value = dateObj.id;
		option.textContent = dateObj.date;
		dateDropdown.appendChild(option);
	});

	// Load the full conference schedule
	const fullSchedule = await getSchedule();
	displaySchedule(fullSchedule);

	// Add an event listener to filter the schedule when a date is selected
	dateDropdown.addEventListener("change", async () => {
		const selectedDateId = dateDropdown.value;

		if (selectedDateId === "") {
			displaySchedule(fullSchedule);
		} else {
			const filteredSchedule = fullSchedule.filter(
				(scheduleItem) => scheduleItem.date === selectedDateId
			);
			displaySchedule(filteredSchedule);
		}
	});

	// Function to display the schedule in the HTML
	function displaySchedule(scheduleData) {
		scheduleContainer.innerHTML = ""; // Clear the container

		scheduleData.forEach((item) => {
			const scheduleItem = document.createElement("div");
			scheduleItem.className = "schedule-item";

			const title = document.createElement("h2");
			title.textContent = item.title;
			scheduleItem.appendChild(title);

			const location = document.createElement("p");
			location.textContent = `Location: ${item.location.name}`;
			scheduleItem.appendChild(location);

			const date = document.createElement("p");
			date.textContent = `Date: ${item.date}`;
			scheduleItem.appendChild(date);

			const sessionsList = document.createElement("ul");
			item.sessions.forEach((session) => {
				const sessionItem = document.createElement("li");
				sessionItem.textContent = session.title;
				sessionsList.appendChild(sessionItem);
			});
			scheduleItem.appendChild(sessionsList);

			scheduleContainer.appendChild(scheduleItem);
		});
	}
}
// === === === === === === === === === === End of Use Case 5 === === === === === === === === ===
