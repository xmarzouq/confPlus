const { PrismaClient } = require("@prisma/client");
const fs = require("fs");

const prisma = new PrismaClient();

async function seedData() {
	// Read JSON files
	const usersData = JSON.parse(fs.readFileSync("./data/users.json", "utf8"));
	const conferenceDatesData = JSON.parse(
		fs.readFileSync("./data/conference-dates.json", "utf8")
	);
	const institutionsData = JSON.parse(
		fs.readFileSync("./data/institutions.json", "utf8")
	);
	const locationsData = JSON.parse(
		fs.readFileSync("./data/locations.json", "utf8")
	);
	const papersData = JSON.parse(fs.readFileSync("./data/papers.json", "utf8"));
	const scheduleData = JSON.parse(
		fs.readFileSync("./data/schedule.json", "utf8")
	);
	/**
	 * seed institutions
	 */
	for (const institutionData of institutionsData) {
		await prisma.institution.create({
			data: {
				// id: institutionData.id,
				name: institutionData.name,
			},
		});
	}

	/**
	 * Seed locations
	 */
	for (const locationData of locationsData) {
		await prisma.location.create({
			data: {
				id: locationData.id,
				name: locationData.name,
			},
		});
	}
	/**
	 * Seed conference dates and their associated schedules
	 */

	for (const date of conferenceDatesData) {
		const { id, date: conferenceDate } = date;
		const schedules = scheduleData.filter((s) => s.date === id);
		await prisma.conferenceDates.create({
			data: {
				id,
				date: new Date(conferenceDate),
				Schedule: {
					create: schedules.map((s) => ({
						id: s.id,
						title: s.title,
						location: {
							connect: { id: s.location.id },
						},
						date: {
							connect: { id },
						},
						sessions: {
							create: s.sessions.map((session) => ({
								id: session.id,
								title: session.title,
								location: {
									connect: { id: session.location },
								},
								date: {
									connect: { id },
								},
								papers: {
									create: session.papers.map((paper) => ({
										id: paper.id,
										fromTime: paper.from_time,
										toTime: paper.to_time,
										title: papersData.find((p) => p.id === paper.id).title,
										abstract: papersData.find((p) => p.id === paper.id)
											.abstract,
										file: papersData.find((p) => p.id === paper.id).file,
										authors: {
											create: papersData
												.find((p) => p.id === paper.id)
												.authors.map((author) => ({
													firstName: author.firstName,
													lastName: author.lastName,
													email: author.email,
													isPresenter: author.isPresenter,
													user: {
														connect: { email: author.email },
													},
													institution: {
														connect: { id: author.affiliation },
													},
												})),
										},
										reviewers: {
											connect: session.papers.reviewer.map((reviewerId) => ({
												userId: reviewerId,
											})),
										},
										reviews: {
											create: papersData
												.find((p) => p.id === paper.id)
												.reviews.map((review) => ({
													overallEvaluation: review.overallEvaluation,
													paperContribution: review.paperContribution,
													paperStrengths: review.paperStrengths,
													paperWeaknesses: review.paperWeaknesses,
												})),
										},
									})),
								},
								reviews: {
									create: session.reviews.map((review) => ({
										overallEvaluation: review.overallEvaluation,
										paperContribution: review.paperContribution,
										paperStrengths: review.paperStrengths,
										paperWeaknesses: review.paperWeaknesses,
										paper: {
											connect: { id: review.paper },
										},
									})),
								},
							})),
						},
					})),
				},
			},
		});
	}
	/**
	 * Seed users and connect their corresponding roles
	 */
	for (const user of usersData) {
		const { id, first_name, last_name, email, password, role } = user;
		await prisma.user.create({
			data: {
				// id,
				firstName: first_name,
				lastName: last_name,
				email,
				password,
				[role]: {
					create: {},
				},
			},
		});
	}

	console.log("Data seeded successfully!");
}

seedData()
	.catch((error) => {
		console.error(error);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
