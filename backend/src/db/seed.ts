import { getCatalogMovie } from "../domain/catalog"
import { db, sqlite } from "./client"
import {
	advocates,
	groupMembers,
	groupMovies,
	groups,
	movieGroupReviews,
	movieIndividualReviews,
	movies,
	queueEntries,
	reviewReadyStatuses,
	screenings,
	turnOrderEntries,
	users,
} from "./schema"

const userRows = [
	{
		id: `user-jeremy`,
		displayName: `Jeremy`,
		faceTag: `jeremy`,
		authentikSubject: `authentik|jeremy`,
	},
	{
		id: `user-moira`,
		displayName: `Moira`,
		faceTag: `moira`,
		authentikSubject: `authentik|moira`,
	},
	{
		id: `user-peter`,
		displayName: `Peter`,
		faceTag: `peter`,
		authentikSubject: `authentik|peter`,
	},
	{
		id: `user-bug`,
		displayName: `Bug`,
		faceTag: `bug`,
		authentikSubject: `authentik|bug`,
	},
]

const movieTitleById = {
	"movie-red-baron": `The Red Baron`,
	"movie-tiptoes": `Tiptoes`,
	"movie-happily": `Happily N'Ever After`,
	"movie-iron-giant": `The Iron Giant`,
	"movie-moonstruck": `Moonstruck`,
	"movie-tampopo": `Tampopo`,
	"movie-wages": `The Wages of Fear`,
	"movie-mikey-nicky": `Mikey and Nicky`,
	"movie-house": `House`,
	"movie-life-death": `A Matter of Life and Death`,
	"movie-black-narcissus": `Black Narcissus`,
	"movie-long-goodbye": `The Long Goodbye`,
	"movie-daisies": `Daisies`,
	"movie-local-hero": `Local Hero`,
	"movie-dr-t": `The 5,000 Fingers of Dr. T.`,
	"movie-police-story": `Police Story`,
} as const

type MovieId = keyof typeof movieTitleById

export async function seedDevData(): Promise<void> {
	const count = sqlite
		.query<{ count: number }, []>(`SELECT count(*) AS count FROM users`)
		.get()
	if (count && count.count > 0) {
		return
	}

	await Promise.resolve()

	db.insert(users).values(userRows).onConflictDoNothing().run()
	db.insert(groups)
		.values([
			{
				id: `group-bmn`,
				name: `BMN`,
				authentikGroupSlug: `moview-bmn`,
				createdByUserId: `user-jeremy`,
			},
			{
				id: `group-moira-bug`,
				name: `Moira and Bug`,
				authentikGroupSlug: `moview-moira-bug`,
				createdByUserId: `user-moira`,
			},
		])
		.onConflictDoNothing()
		.run()
	db.insert(groupMembers)
		.values([
			member(`group-bmn`, `user-jeremy`, `admin`, `joined`),
			member(`group-bmn`, `user-moira`, `member`, `joined`),
			member(`group-bmn`, `user-peter`, `member`, `joined`),
			member(`group-moira-bug`, `user-moira`, `admin`, `joined`),
			member(`group-moira-bug`, `user-bug`, `member`, `invited`),
		])
		.onConflictDoNothing()
		.run()
	db.insert(movies)
		.values(
			Object.entries(movieTitleById).map(([id, title]) => ({
				id,
				...getCatalogMovie(title),
			})),
		)
		.onConflictDoNothing()
		.run()

	db.insert(groupMovies)
		.values([
			groupMovie(`group-bmn`, `movie-red-baron`, `user-jeremy`),
			groupMovie(`group-bmn`, `movie-iron-giant`, `user-jeremy`),
			groupMovie(`group-bmn`, `movie-house`, `user-jeremy`),
			groupMovie(`group-bmn`, `movie-long-goodbye`, `user-jeremy`),
			groupMovie(`group-bmn`, `movie-moonstruck`, `user-moira`),
			groupMovie(`group-bmn`, `movie-tiptoes`, `user-peter`),
			groupMovie(`group-bmn`, `movie-happily`, `user-peter`),
			groupMovie(`group-bmn`, `movie-tampopo`, `user-moira`),
			groupMovie(`group-bmn`, `movie-wages`, `user-peter`),
			groupMovie(`group-bmn`, `movie-mikey-nicky`, `user-peter`),
			groupMovie(`group-bmn`, `movie-life-death`, `user-moira`),
			groupMovie(`group-bmn`, `movie-black-narcissus`, `user-moira`),
			groupMovie(`group-bmn`, `movie-daisies`, `user-moira`),
			groupMovie(`group-bmn`, `movie-local-hero`, `user-jeremy`),
			groupMovie(`group-bmn`, `movie-dr-t`, `user-peter`),
			groupMovie(`group-moira-bug`, `movie-police-story`, `user-moira`),
		])
		.onConflictDoNothing()
		.run()

	db.insert(advocates)
		.values([
			advocate(`group-bmn`, `movie-red-baron`, `user-jeremy`, 1, 1),
			advocate(`group-bmn`, `movie-iron-giant`, `user-jeremy`, 1, 2),
			advocate(`group-bmn`, `movie-house`, `user-jeremy`, 1, 3),
			advocate(`group-bmn`, `movie-long-goodbye`, `user-jeremy`, 1, 4),
			advocate(`group-bmn`, `movie-moonstruck`, `user-moira`, 1, 1),
			advocate(`group-bmn`, `movie-moonstruck`, `user-jeremy`, 2, 5),
			advocate(`group-bmn`, `movie-tampopo`, `user-moira`, 1, 2),
			advocate(`group-bmn`, `movie-life-death`, `user-moira`, 1, 3),
			advocate(`group-bmn`, `movie-black-narcissus`, `user-moira`, 1, 4),
			advocate(`group-bmn`, `movie-daisies`, `user-moira`, 1, 5),
			advocate(`group-bmn`, `movie-red-baron`, `user-peter`, 2, 12.130561),
			advocate(`group-bmn`, `movie-iron-giant`, `user-peter`, 2, 24.2),
			advocate(`group-bmn`, `movie-wages`, `user-peter`, 1, 41.75),
			advocate(`group-bmn`, `movie-mikey-nicky`, `user-peter`, 1, 52.5),
			advocate(`group-bmn`, `movie-tiptoes`, `user-peter`, 1, 63.1065076),
			advocate(`group-bmn`, `movie-house`, `user-peter`, 2, 78.25),
			advocate(`group-bmn`, `movie-local-hero`, `user-peter`, 2, 91),
			advocate(`group-bmn`, `movie-dr-t`, `user-peter`, 1, 99.5),
			advocate(`group-bmn`, `movie-happily`, `user-peter`, 1, 103.463603701),
			advocate(`group-bmn`, `movie-long-goodbye`, `user-peter`, 2, 88),
			advocate(`group-moira-bug`, `movie-police-story`, `user-moira`, 1, 1),
		])
		.onConflictDoNothing()
		.run()

	db.insert(queueEntries)
		.values([
			queueEntry(`group-bmn`, `movie-house`, `user-jeremy`, 0, `on_deck`),
			queueEntry(`group-bmn`, `movie-tampopo`, `user-moira`, 1, `upcoming`),
			queueEntry(`group-bmn`, `movie-wages`, `user-peter`, 1.5, `upcoming`),
			queueEntry(`group-bmn`, `movie-life-death`, `user-moira`, 2, `upcoming`),
			queueEntry(
				`group-bmn`,
				`movie-black-narcissus`,
				`user-moira`,
				3,
				`upcoming`,
			),
			queueEntry(`group-bmn`, `movie-daisies`, `user-moira`, 4, `upcoming`),
			queueEntry(`group-bmn`, `movie-moonstruck`, `user-moira`, 5, `upcoming`),
			queueEntry(`group-bmn`, `movie-local-hero`, `user-moira`, 6, `upcoming`),
			queueEntry(`group-bmn`, `movie-iron-giant`, `user-moira`, 7, `upcoming`),
			queueEntry(`group-bmn`, `movie-red-baron`, `user-moira`, 8, `upcoming`),
			queueEntry(`group-bmn`, `movie-tiptoes`, `user-moira`, 9, `upcoming`),
			queueEntry(`group-bmn`, `movie-happily`, `user-moira`, 10, `upcoming`),
			queueEntry(`group-bmn`, `movie-mikey-nicky`, `user-moira`, 11, `upcoming`),
			queueEntry(`group-bmn`, `movie-dr-t`, `user-moira`, 12, `upcoming`),
		])
		.onConflictDoNothing()
		.run()

	db.insert(turnOrderEntries)
		.values([
			turn(`group-bmn`, `user-jeremy`, 0, true),
			turn(`group-bmn`, `user-moira`, 1, false),
			turn(`group-bmn`, `user-peter`, 2, false),
			turn(`group-moira-bug`, `user-moira`, 0, true),
			turn(`group-moira-bug`, `user-bug`, 1, false),
		])
		.onConflictDoNothing()
		.run()

	db.insert(screenings)
		.values([
			{
				id: `screening-bmn-tampopo`,
				groupId: `group-bmn`,
				movieId: `movie-tampopo`,
				chosenByUserId: `user-moira`,
				dateWatched: `2026-06-20`,
			},
		])
		.onConflictDoNothing()
		.run()
	db.insert(movieGroupReviews)
		.values([
			groupReview(`group-bmn`, `movie-tampopo`, `user-jeremy`, 4),
			groupReview(`group-bmn`, `movie-tampopo`, `user-moira`, 5),
			groupReview(`group-bmn`, `movie-tampopo`, `user-peter`, 3),
		])
		.onConflictDoNothing()
		.run()
	db.insert(movieIndividualReviews)
		.values([
			individualReview(
				`movie-tampopo`,
				`user-jeremy`,
				8,
				`Warm, strange, and immediately made me hungry.`,
			),
			individualReview(
				`movie-tampopo`,
				`user-moira`,
				9,
				`Exactly the kind of generous chaos I wanted.`,
			),
			individualReview(
				`movie-tampopo`,
				`user-peter`,
				7,
				`Deeply good, with one too many noodle detours for me.`,
			),
		])
		.onConflictDoNothing()
		.run()
	db.insert(reviewReadyStatuses)
		.values([
			ready(`group-bmn`, `movie-tampopo`, `user-jeremy`, true),
			ready(`group-bmn`, `movie-tampopo`, `user-moira`, true),
			ready(`group-bmn`, `movie-tampopo`, `user-peter`, true),
		])
		.onConflictDoNothing()
		.run()
}

function member(
	groupId: string,
	userId: string,
	role: `admin` | `member`,
	inviteStatus: `joined` | `invited`,
) {
	return {
		id: `member-${groupId}-${userId}`,
		groupId,
		userId,
		role,
		inviteStatus,
	}
}

function groupMovie(
	groupId: string,
	movieId: MovieId,
	contributorUserId: string,
) {
	return {
		id: `group-movie-${groupId}-${movieId}`,
		groupId,
		movieId,
		contributorUserId,
	}
}

function advocate(
	groupId: string,
	movieId: MovieId,
	userId: string,
	advocateNumber: number,
	rank: number,
) {
	return {
		id: `advocate-${groupId}-${movieId}-${userId}`,
		groupId,
		movieId,
		userId,
		advocateNumber,
		rank,
	}
}

function queueEntry(
	groupId: string,
	movieId: MovieId,
	addedByUserId: string,
	position: number,
	status: `upcoming` | `on_deck`,
) {
	return {
		id: `queue-${groupId}-${movieId}-${position.toString().replace(`.`, `-`)}`,
		groupId,
		movieId,
		addedByUserId,
		position,
		status,
	}
}

function turn(
	groupId: string,
	userId: string,
	turnIndex: number,
	isCurrent: boolean,
) {
	return {
		id: `turn-${groupId}-${userId}`,
		groupId,
		userId,
		turnIndex,
		isCurrent,
	}
}

function groupReview(
	groupId: string,
	movieId: MovieId,
	userId: string,
	goodnessOfPick: number,
) {
	return {
		id: `group-review-${groupId}-${movieId}-${userId}`,
		groupId,
		movieId,
		userId,
		goodnessOfPick,
	}
}

function individualReview(
	movieId: MovieId,
	userId: string,
	rating: number,
	feelings: string,
) {
	return {
		id: `individual-review-${movieId}-${userId}`,
		movieId,
		userId,
		rating,
		feelings,
	}
}

function ready(
	groupId: string,
	movieId: MovieId,
	userId: string,
	isReady: boolean,
) {
	return {
		id: `ready-${groupId}-${movieId}-${userId}`,
		groupId,
		movieId,
		userId,
		ready: isReady,
	}
}
