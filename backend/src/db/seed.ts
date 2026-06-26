import { eq } from "drizzle-orm"

import { db } from "./client"
import {
	advocates,
	groupReviews,
	groups,
	individualReviews,
	memberships,
	movieNights,
	movies,
	queueEntries,
	turnOrderEntries,
	users,
} from "./schema"

const people = [
	{
		avatarColor: `#ca3f37`,
		displayName: `Jeremy`,
		email: `jeremy@moview.test`,
		id: `user-jeremy`,
	},
	{
		avatarColor: `#4d7cba`,
		displayName: `Moira`,
		email: `moira@moview.test`,
		id: `user-moira`,
	},
	{
		avatarColor: `#4f8c5f`,
		displayName: `Peter`,
		email: `peter@moview.test`,
		id: `user-peter`,
	},
	{
		avatarColor: `#b37a2c`,
		displayName: `Bug`,
		email: `bug@moview.test`,
		id: `user-bug`,
	},
] satisfies Array<{
	avatarColor: string
	displayName: string
	email: string
	id: string
}>

const seededMovies = [
	{
		description: `A desert-world epic with political pressure, big feelings, and enough sand to make snacks feel dangerous.`,
		id: `movie-dune`,
		posterPath: `https://image.tmdb.org/t/p/w342/d5NXSklXo0qyIYkgV94XAgMIckC.jpg`,
		sourceId: `438631`,
		title: `Dune`,
		year: 2021,
	},
	{
		description: `A family laundromat, fractured realities, tax anxiety, and a surprising amount of tenderness.`,
		id: `movie-everything`,
		posterPath: `https://image.tmdb.org/t/p/w342/w3LxiVYdWWRvEVdn5RYq6jIqkb1.jpg`,
		sourceId: `545611`,
		title: `Everything Everywhere All at Once`,
		year: 2022,
	},
	{
		description: `A meticulous Budapest hotel caper with confection colors, formal manners, and mounting chaos.`,
		id: `movie-grand-budapest`,
		posterPath: `https://image.tmdb.org/t/p/w342/eWdyYQreja6JGCzqHWXpWHDrrPo.jpg`,
		sourceId: `120467`,
		title: `The Grand Budapest Hotel`,
		year: 2014,
	},
	{
		description: `A martial-arts fairytale that moves like memory and looks like a painted blade.`,
		id: `movie-crouching`,
		posterPath: `https://image.tmdb.org/t/p/w342/iNDVBFNz4XyYzM9Lwip6atSTFqf.jpg`,
		sourceId: `146`,
		title: `Crouching Tiger, Hidden Dragon`,
		year: 2000,
	},
	{
		description: `A detective story, a romance with weather, and a stunning argument for looking closely.`,
		id: `movie-burning`,
		posterPath: `https://image.tmdb.org/t/p/w342/kXiO80KkjZ6JMTiA6j13JnNSTmF.jpg`,
		sourceId: `491584`,
		title: `Burning`,
		year: 2018,
	},
	{
		description: `A lovingly ridiculous personal-view test movie with an impossible cast and strong ranking opinions.`,
		id: `movie-tiptoes`,
		posterPath: null,
		sourceId: null,
		title: `Tiptoes`,
		year: 2003,
	},
	{
		description: `Peter's top-ranked aviation melodrama, mostly here to prove midpoint ranking math.`,
		id: `movie-red-baron`,
		posterPath: null,
		sourceId: null,
		title: `The Red Baron`,
		year: 2008,
	},
	{
		description: `Peter's previous personal-list closer, carrying a wonderfully specific rank.`,
		id: `movie-happily`,
		posterPath: null,
		sourceId: null,
		title: `Happily N'ever After`,
		year: 2006,
	},
] as const

export async function seedDevData(): Promise<void> {
	const existing = await db
		.select({ id: users.id })
		.from(users)
		.where(eq(users.id, `user-jeremy`))
		.limit(1)
	if (existing.length > 0) {
		return
	}
	await db.insert(users).values(people)
	await db.insert(groups).values([
		{
			authentikGroup: `moview-friends`,
			createdByUserId: `user-jeremy`,
			id: `group-friends`,
			name: `Friday Movie Night`,
		},
		{
			authentikGroup: `moview-moira-bug`,
			createdByUserId: `user-moira`,
			id: `group-moira-bug`,
			name: `Moira and Bug`,
		},
	])
	await db.insert(memberships).values([
		{
			groupId: `group-friends`,
			id: `member-jeremy`,
			role: `admin`,
			userId: `user-jeremy`,
		},
		{
			groupId: `group-friends`,
			id: `member-moira`,
			role: `member`,
			userId: `user-moira`,
		},
		{
			groupId: `group-friends`,
			id: `member-peter`,
			role: `member`,
			userId: `user-peter`,
		},
		{
			groupId: `group-moira-bug`,
			id: `member-moira-bug-1`,
			role: `admin`,
			userId: `user-moira`,
		},
		{
			groupId: `group-moira-bug`,
			id: `member-moira-bug-2`,
			role: `member`,
			userId: `user-bug`,
		},
	])
	await db.insert(movies).values(
		seededMovies.map((movie) => ({
			...movie,
			metadataSource: movie.sourceId ? (`tmdb` as const) : (`manual` as const),
		})),
	)
	await db.insert(advocates).values([
		{
			advocateNumber: 1,
			groupId: `group-friends`,
			id: `adv-dune-jeremy`,
			movieId: `movie-dune`,
			rank: 1,
			userId: `user-jeremy`,
		},
		{
			advocateNumber: 1,
			groupId: `group-friends`,
			id: `adv-everything-moira`,
			movieId: `movie-everything`,
			rank: 1,
			userId: `user-moira`,
		},
		{
			advocateNumber: 2,
			groupId: `group-friends`,
			id: `adv-everything-jeremy`,
			movieId: `movie-everything`,
			rank: 2,
			userId: `user-jeremy`,
		},
		{
			advocateNumber: 1,
			groupId: `group-friends`,
			id: `adv-grand-peter`,
			movieId: `movie-grand-budapest`,
			rank: 3,
			userId: `user-peter`,
		},
		{
			advocateNumber: 1,
			groupId: `group-friends`,
			id: `adv-crouching-jeremy`,
			movieId: `movie-crouching`,
			rank: 3,
			userId: `user-jeremy`,
		},
		{
			advocateNumber: 1,
			groupId: `group-friends`,
			id: `adv-burning-moira`,
			movieId: `movie-burning`,
			rank: 2,
			userId: `user-moira`,
		},
		{
			advocateNumber: 1,
			groupId: `group-friends`,
			id: `adv-tiptoes-peter`,
			movieId: `movie-tiptoes`,
			rank: 104,
			userId: `user-peter`,
		},
		{
			advocateNumber: 1,
			groupId: `group-friends`,
			id: `adv-red-baron-peter`,
			movieId: `movie-red-baron`,
			rank: 103.7318018505,
			userId: `user-peter`,
		},
		{
			advocateNumber: 1,
			groupId: `group-friends`,
			id: `adv-happily-peter`,
			movieId: `movie-happily`,
			rank: 103.463603701,
			userId: `user-peter`,
		},
	])
	await db.insert(queueEntries).values([
		{
			addedByUserId: `user-jeremy`,
			groupId: `group-friends`,
			id: `queue-dune`,
			movieId: `movie-dune`,
			position: 1,
		},
		{
			addedByUserId: `user-peter`,
			groupId: `group-friends`,
			id: `queue-grand`,
			movieId: `movie-grand-budapest`,
			position: 2,
		},
		{
			addedByUserId: `user-moira`,
			groupId: `group-friends`,
			id: `queue-burning`,
			movieId: `movie-burning`,
			position: 3,
		},
	])
	await db.insert(turnOrderEntries).values([
		{
			groupId: `group-friends`,
			id: `turn-jeremy`,
			position: 1,
			userId: `user-jeremy`,
		},
		{
			groupId: `group-friends`,
			id: `turn-moira`,
			position: 2,
			userId: `user-moira`,
		},
		{
			groupId: `group-friends`,
			id: `turn-peter`,
			position: 3,
			userId: `user-peter`,
		},
	])
	await db.insert(movieNights).values([
		{
			chosenByUserId: `user-moira`,
			dateWatched: `2026-06-12`,
			groupId: `group-friends`,
			id: `night-everything`,
			movieId: `movie-everything`,
		},
	])
	await db.insert(groupReviews).values([
		{
			goodnessOfPick: 4,
			groupId: `group-friends`,
			id: `group-review-jeremy`,
			movieId: `movie-everything`,
			movieNightId: `night-everything`,
			userId: `user-jeremy`,
		},
		{
			goodnessOfPick: 5,
			groupId: `group-friends`,
			id: `group-review-moira`,
			movieId: `movie-everything`,
			movieNightId: `night-everything`,
			userId: `user-moira`,
		},
		{
			goodnessOfPick: 3,
			groupId: `group-friends`,
			id: `group-review-peter`,
			movieId: `movie-everything`,
			movieNightId: `night-everything`,
			userId: `user-peter`,
		},
	])
	await db.insert(individualReviews).values([
		{
			feelings: `Exhausting in the exact way I wanted.`,
			id: `review-jeremy`,
			movieId: `movie-everything`,
			movieNightId: `night-everything`,
			rating: 5,
			userId: `user-jeremy`,
		},
		{
			feelings: `A perfect pick for a group night.`,
			id: `review-moira`,
			movieId: `movie-everything`,
			movieNightId: `night-everything`,
			rating: 5,
			userId: `user-moira`,
		},
		{
			feelings: `Deeply weird, very good.`,
			id: `review-peter`,
			movieId: `movie-everything`,
			movieNightId: `night-everything`,
			rating: 4,
			userId: `user-peter`,
		},
	])
}
