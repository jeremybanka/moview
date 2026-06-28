import { and, asc, desc, eq } from "drizzle-orm"

import { db } from "../db/client"
import {
	type Advocate,
	advocates,
	type Group,
	type GroupMember,
	groupMembers,
	groupMovies,
	groups,
	type Movie,
	movieGroupReviews,
	movieIndividualReviews,
	movies,
	queueEntries,
	type QueueEntry,
	reviewReadyStatuses,
	type Screening,
	screenings,
	turnOrderEntries,
	type TurnOrderEntry,
	type User,
	users,
} from "../db/schema"
import { getCatalogMovie, normalizeTitle } from "./catalog"

export type PoolMovie = {
	advocates: Array<Advocate & { user: User }>
	contributor: User
	groupMovieId: string
	isQueued: boolean
	movie: Movie
}

export type QueueMovie = QueueEntry & {
	addedBy: User
	movie: Movie
}

export type PersonalMovie = Advocate & {
	contributor: User
	movie: Movie
}

export type ReviewSummary = Screening & {
	averageGoodnessOfPick: number
	averageRating: number
	goodnessOfPick: Array<{
		user: User
		value: number
	}>
	individualRatings: Array<{
		feelings: string | null
		user: User
		value: number
	}>
	movie: Movie
	ready: Array<{
		ready: boolean
		user: User
	}>
}

export type AppState = {
	activeGroup: Group
	currentUser: User
	groups: Group[]
	history: ReviewSummary[]
	members: Array<GroupMember & { user: User }>
	personalPool: PersonalMovie[]
	pool: PoolMovie[]
	queue: QueueMovie[]
	turnOrder: Array<TurnOrderEntry & { user: User }>
	users: User[]
}

type AppStateOptions = {
	groupId?: string | null
	userId?: string | null
}

export function getAppState(options: AppStateOptions = {}): AppState {
	const allUsers = db.select().from(users).orderBy(asc(users.displayName)).all()
	const allGroups = db.select().from(groups).orderBy(asc(groups.name)).all()
	const allMembers = db.select().from(groupMembers).all()

	const currentUser =
		allUsers.find((user) => user.id === options.userId) ??
		allUsers.find((user) => user.id === `user-jeremy`) ??
		allUsers[0]
	if (!currentUser) {
		throw new Error(`Moview has no users. Seed data has not been loaded.`)
	}

	const activeGroup = resolveActiveGroup({
		allGroups,
		allMembers,
		currentUser,
		groupId: options.groupId,
	})
	const members = allMembers
		.filter((member) => member.groupId === activeGroup.id)
		.map((member) => ({
			...member,
			user: requireUser(allUsers, member.userId),
		}))
		.sort((a, b) => a.user.displayName.localeCompare(b.user.displayName))

	const movieRows = db.select().from(movies).orderBy(asc(movies.title)).all()
	const groupMovieRows = db
		.select()
		.from(groupMovies)
		.where(eq(groupMovies.groupId, activeGroup.id))
		.all()
	const advocateRows = db
		.select()
		.from(advocates)
		.where(eq(advocates.groupId, activeGroup.id))
		.orderBy(asc(advocates.rank))
		.all()
	const queueRows = db
		.select()
		.from(queueEntries)
		.where(eq(queueEntries.groupId, activeGroup.id))
		.orderBy(asc(queueEntries.position))
		.all()
	const queuedMovieIds = new Set(
		queueRows.map((queueEntry) => queueEntry.movieId),
	)

	const pool = groupMovieRows
		.map((groupMovie) => ({
			advocates: advocateRows
				.filter((advocate) => advocate.movieId === groupMovie.movieId)
				.map((advocate) => ({
					...advocate,
					user: requireUser(allUsers, advocate.userId),
				}))
				.sort((a, b) => a.advocateNumber - b.advocateNumber),
			contributor: requireUser(allUsers, groupMovie.contributorUserId),
			groupMovieId: groupMovie.id,
			isQueued: queuedMovieIds.has(groupMovie.movieId),
			movie: requireMovie(movieRows, groupMovie.movieId),
		}))
		.sort((a, b) => a.movie.title.localeCompare(b.movie.title))

	const personalPool = advocateRows
		.filter((advocate) => advocate.userId === currentUser.id)
		.map((advocate) => {
			const movie = requireMovie(movieRows, advocate.movieId)
			const groupMovie = requireGroupMovie(groupMovieRows, movie.id)
			return {
				...advocate,
				contributor: requireUser(allUsers, groupMovie.contributorUserId),
				movie,
			}
		})
		.sort((a, b) => a.rank - b.rank)

	const queue = queueRows.map((queueEntry) => ({
		...queueEntry,
		addedBy: requireUser(allUsers, queueEntry.addedByUserId),
		movie: requireMovie(movieRows, queueEntry.movieId),
	}))

	const turnOrder = db
		.select()
		.from(turnOrderEntries)
		.where(eq(turnOrderEntries.groupId, activeGroup.id))
		.orderBy(asc(turnOrderEntries.turnIndex))
		.all()
		.map((turnOrderEntry) => ({
			...turnOrderEntry,
			user: requireUser(allUsers, turnOrderEntry.userId),
		}))

	const history = getHistory(activeGroup, allUsers, movieRows)

	return {
		activeGroup,
		currentUser,
		groups: allGroups,
		history,
		members,
		personalPool,
		pool,
		queue,
		turnOrder,
		users: allUsers,
	}
}

export function addMovieToGroup(input: {
	description?: string
	groupId: string
	imageUrl?: string
	releasedYear?: number
	title: string
	userId: string
}): AppState {
	const metadata = {
		...getCatalogMovie(input.title),
		description: input.description ?? getCatalogMovie(input.title).description,
		imageUrl: input.imageUrl ?? getCatalogMovie(input.title).imageUrl,
		releasedYear:
			input.releasedYear ?? getCatalogMovie(input.title).releasedYear,
	}
	const existingMovie = db
		.select()
		.from(movies)
		.all()
		.find(
			(movie) => normalizeTitle(movie.title) === normalizeTitle(metadata.title),
		)
	const movie = existingMovie ?? {
		id: uniqueId(`movie-${slugify(metadata.title)}`),
		...metadata,
	}

	if (!existingMovie) {
		db.insert(movies).values(movie).run()
	}

	const existingGroupMovie = db
		.select()
		.from(groupMovies)
		.where(
			and(
				eq(groupMovies.groupId, input.groupId),
				eq(groupMovies.movieId, movie.id),
			),
		)
		.get()
	if (!existingGroupMovie) {
		db.insert(groupMovies)
			.values({
				id: uniqueId(`group-movie-${input.groupId}-${movie.id}`),
				groupId: input.groupId,
				movieId: movie.id,
				contributorUserId: input.userId,
			})
			.run()
	}

	const existingAdvocate = db
		.select()
		.from(advocates)
		.where(
			and(
				eq(advocates.groupId, input.groupId),
				eq(advocates.movieId, movie.id),
				eq(advocates.userId, input.userId),
			),
		)
		.get()

	if (!existingAdvocate) {
		db.insert(advocates)
			.values({
				id: uniqueId(`advocate-${input.groupId}-${movie.id}-${input.userId}`),
				groupId: input.groupId,
				movieId: movie.id,
				userId: input.userId,
				advocateNumber: nextAdvocateNumber(input.groupId, movie.id),
				rank: nextRank(input.groupId, input.userId),
			})
			.run()
	}

	return getAppState({ groupId: input.groupId, userId: input.userId })
}

export function createGroup(input: {
	creatorUserId: string
	name: string
}): AppState {
	const group = {
		id: uniqueId(`group-${slugify(input.name)}`),
		name: input.name,
		authentikGroupSlug: uniqueSlug(`moview-${slugify(input.name)}`),
		createdByUserId: input.creatorUserId,
	}
	db.insert(groups).values(group).run()
	db.insert(groupMembers)
		.values({
			id: uniqueId(`member-${group.id}-${input.creatorUserId}`),
			groupId: group.id,
			userId: input.creatorUserId,
			role: `admin`,
			inviteStatus: `joined`,
		})
		.run()
	db.insert(turnOrderEntries)
		.values({
			id: uniqueId(`turn-${group.id}-${input.creatorUserId}`),
			groupId: group.id,
			userId: input.creatorUserId,
			turnIndex: 0,
			isCurrent: true,
		})
		.run()
	return getAppState({ groupId: group.id, userId: input.creatorUserId })
}

export function inviteUser(input: {
	groupId: string
	userId: string
}): AppState {
	const existing = db
		.select()
		.from(groupMembers)
		.where(
			and(
				eq(groupMembers.groupId, input.groupId),
				eq(groupMembers.userId, input.userId),
			),
		)
		.get()
	if (!existing) {
		db.insert(groupMembers)
			.values({
				id: uniqueId(`member-${input.groupId}-${input.userId}`),
				groupId: input.groupId,
				userId: input.userId,
				role: `member`,
				inviteStatus: `invited`,
			})
			.run()
		const nextTurnIndex = db
			.select()
			.from(turnOrderEntries)
			.where(eq(turnOrderEntries.groupId, input.groupId))
			.all().length
		db.insert(turnOrderEntries)
			.values({
				id: uniqueId(`turn-${input.groupId}-${input.userId}`),
				groupId: input.groupId,
				userId: input.userId,
				turnIndex: nextTurnIndex,
				isCurrent: false,
			})
			.run()
	}
	return getAppState({ groupId: input.groupId, userId: input.userId })
}

export function placeQueueEntry(input: {
	groupId: string
	movieId: string
	placement: `end` | `on_deck` | `second`
	userId: string
}): AppState {
	const queue = db
		.select()
		.from(queueEntries)
		.where(eq(queueEntries.groupId, input.groupId))
		.orderBy(asc(queueEntries.position))
		.all()
	const position = getQueuePosition(queue, input.placement)
	db.insert(queueEntries)
		.values({
			id: uniqueId(`queue-${input.groupId}-${input.movieId}`),
			groupId: input.groupId,
			movieId: input.movieId,
			addedByUserId: input.userId,
			position,
			status: input.placement === `on_deck` ? `on_deck` : `upcoming`,
		})
		.run()
	return getAppState({ groupId: input.groupId, userId: input.userId })
}

export function returnQueueEntry(input: {
	queueEntryId: string
	userId?: string
}): AppState {
	const queueEntry = db
		.select()
		.from(queueEntries)
		.where(eq(queueEntries.id, input.queueEntryId))
		.get()
	if (!queueEntry) {
		throw new Error(`Queue entry not found.`)
	}
	db.delete(queueEntries).where(eq(queueEntries.id, input.queueEntryId)).run()
	return getAppState({ groupId: queueEntry.groupId, userId: input.userId })
}

export function updatePersonalRank(input: {
	advocateId: string
	afterAdvocateId?: string
	beforeAdvocateId?: string
}): AppState {
	const target = requireAdvocate(input.advocateId)
	const before = input.beforeAdvocateId
		? requireAdvocate(input.beforeAdvocateId)
		: null
	const after = input.afterAdvocateId
		? requireAdvocate(input.afterAdvocateId)
		: null
	const rank = availableRank(
		target.groupId,
		target.userId,
		getRank({ after, before, target }),
	)
	db.update(advocates).set({ rank }).where(eq(advocates.id, target.id)).run()
	return getAppState({ groupId: target.groupId, userId: target.userId })
}

export function submitReview(input: {
	feelings?: string
	goodnessOfPick: number
	groupId: string
	movieId: string
	rating: number
	userId: string
}): AppState {
	db.delete(movieGroupReviews)
		.where(
			and(
				eq(movieGroupReviews.groupId, input.groupId),
				eq(movieGroupReviews.movieId, input.movieId),
				eq(movieGroupReviews.userId, input.userId),
			),
		)
		.run()
	db.delete(movieIndividualReviews)
		.where(
			and(
				eq(movieIndividualReviews.movieId, input.movieId),
				eq(movieIndividualReviews.userId, input.userId),
			),
		)
		.run()
	db.delete(reviewReadyStatuses)
		.where(
			and(
				eq(reviewReadyStatuses.groupId, input.groupId),
				eq(reviewReadyStatuses.movieId, input.movieId),
				eq(reviewReadyStatuses.userId, input.userId),
			),
		)
		.run()
	db.insert(movieGroupReviews)
		.values({
			id: uniqueId(
				`group-review-${input.groupId}-${input.movieId}-${input.userId}`,
			),
			groupId: input.groupId,
			movieId: input.movieId,
			userId: input.userId,
			goodnessOfPick: input.goodnessOfPick,
		})
		.run()
	db.insert(movieIndividualReviews)
		.values({
			id: uniqueId(`individual-review-${input.movieId}-${input.userId}`),
			movieId: input.movieId,
			userId: input.userId,
			rating: input.rating,
			feelings: input.feelings ?? null,
		})
		.run()
	db.insert(reviewReadyStatuses)
		.values({
			id: uniqueId(`ready-${input.groupId}-${input.movieId}-${input.userId}`),
			groupId: input.groupId,
			movieId: input.movieId,
			userId: input.userId,
			ready: true,
		})
		.run()
	return getAppState({ groupId: input.groupId, userId: input.userId })
}

function resolveActiveGroup(input: {
	allGroups: Group[]
	allMembers: GroupMember[]
	currentUser: User
	groupId?: string | null
}): Group {
	const selected = input.groupId
		? input.allGroups.find((group) => group.id === input.groupId)
		: undefined
	if (selected) {
		return selected
	}
	const joinedMembership = input.allMembers.find(
		(member) =>
			member.userId === input.currentUser.id && member.inviteStatus === `joined`,
	)
	const joinedGroup = input.allGroups.find(
		(group) => group.id === joinedMembership?.groupId,
	)
	const fallback = joinedGroup ?? input.allGroups[0]
	if (!fallback) {
		throw new Error(`Moview has no groups. Seed data has not been loaded.`)
	}
	return fallback
}

function getHistory(
	activeGroup: Group,
	allUsers: User[],
	movieRows: Movie[],
): ReviewSummary[] {
	const groupScreenings = db
		.select()
		.from(screenings)
		.where(eq(screenings.groupId, activeGroup.id))
		.orderBy(desc(screenings.dateWatched))
		.all()
	const groupReviews = db
		.select()
		.from(movieGroupReviews)
		.where(eq(movieGroupReviews.groupId, activeGroup.id))
		.all()
	const individualReviews = db.select().from(movieIndividualReviews).all()
	const readyRows = db
		.select()
		.from(reviewReadyStatuses)
		.where(eq(reviewReadyStatuses.groupId, activeGroup.id))
		.all()

	return groupScreenings.map((screening) => {
		const movieGoodness = groupReviews.filter(
			(review) => review.movieId === screening.movieId,
		)
		const movieRatings = individualReviews.filter(
			(review) => review.movieId === screening.movieId,
		)
		const ready = readyRows.filter((row) => row.movieId === screening.movieId)
		return {
			...screening,
			averageGoodnessOfPick: average(
				movieGoodness.map((review) => review.goodnessOfPick),
			),
			averageRating: average(movieRatings.map((review) => review.rating)),
			goodnessOfPick: movieGoodness.map((review) => ({
				user: requireUser(allUsers, review.userId),
				value: review.goodnessOfPick,
			})),
			individualRatings: movieRatings.map((review) => ({
				feelings: review.feelings,
				user: requireUser(allUsers, review.userId),
				value: review.rating,
			})),
			movie: requireMovie(movieRows, screening.movieId),
			ready: ready.map((row) => ({
				ready: row.ready,
				user: requireUser(allUsers, row.userId),
			})),
		}
	})
}

function getQueuePosition(
	queue: QueueEntry[],
	placement: `end` | `on_deck` | `second`,
): number {
	if (queue.length === 0) {
		return 1
	}
	if (placement === `on_deck`) {
		return queue[0]!.position - 1
	}
	if (placement === `second`) {
		const first = queue[0]!
		const second = queue[1]
		return second ? (first.position + second.position) / 2 : first.position + 1
	}
	return Math.floor(queue[queue.length - 1]!.position) + 1
}

function getRank(input: {
	after: Advocate | null
	before: Advocate | null
	target: Advocate
}): number {
	if (input.before && input.after) {
		return (input.before.rank + input.after.rank) / 2
	}
	if (input.after) {
		return Math.floor(input.after.rank) + 1
	}
	if (input.before) {
		return input.before.rank - 1
	}
	return nextRank(input.target.groupId, input.target.userId)
}

function nextAdvocateNumber(groupId: string, movieId: string): number {
	const existing = db
		.select()
		.from(advocates)
		.where(and(eq(advocates.groupId, groupId), eq(advocates.movieId, movieId)))
		.all()
	return Math.max(0, ...existing.map((advocate) => advocate.advocateNumber)) + 1
}

function nextRank(groupId: string, userId: string): number {
	const existing = db
		.select()
		.from(advocates)
		.where(and(eq(advocates.groupId, groupId), eq(advocates.userId, userId)))
		.all()
	return (
		Math.floor(Math.max(0, ...existing.map((advocate) => advocate.rank))) + 1
	)
}

function availableRank(groupId: string, userId: string, rank: number): number {
	let candidate = rank
	const used = new Set(
		db
			.select()
			.from(advocates)
			.where(and(eq(advocates.groupId, groupId), eq(advocates.userId, userId)))
			.all()
			.map((advocate) => advocate.rank),
	)
	while (used.has(candidate)) {
		candidate += 0.000001
	}
	return candidate
}

function uniqueId(prefix: string): string {
	return `${prefix}-${crypto.randomUUID().slice(0, 8)}`
}

function uniqueSlug(slug: string): string {
	const existing = new Set(
		db
			.select()
			.from(groups)
			.all()
			.map((group) => group.authentikGroupSlug),
	)
	if (!existing.has(slug)) {
		return slug
	}
	return `${slug}-${crypto.randomUUID().slice(0, 6)}`
}

function slugify(value: string): string {
	return value
		.toLocaleLowerCase()
		.replaceAll(/[^a-z0-9]+/g, `-`)
		.replaceAll(/(^-|-$)/g, ``)
}

function requireUser(allUsers: User[], userId: string): User {
	const user = allUsers.find((candidate) => candidate.id === userId)
	if (!user) {
		throw new Error(`User ${userId} not found.`)
	}
	return user
}

function requireMovie(movieRows: Movie[], movieId: string): Movie {
	const movie = movieRows.find((candidate) => candidate.id === movieId)
	if (!movie) {
		throw new Error(`Movie ${movieId} not found.`)
	}
	return movie
}

function requireGroupMovie(
	groupMovieRows: Array<{ contributorUserId: string; movieId: string }>,
	movieId: string,
) {
	const groupMovie = groupMovieRows.find(
		(candidate) => candidate.movieId === movieId,
	)
	if (!groupMovie) {
		throw new Error(`Group movie ${movieId} not found.`)
	}
	return groupMovie
}

function requireAdvocate(advocateId: string): Advocate {
	const advocate = db
		.select()
		.from(advocates)
		.where(eq(advocates.id, advocateId))
		.get()
	if (!advocate) {
		throw new Error(`Advocate ${advocateId} not found.`)
	}
	return advocate
}

function average(values: number[]): number {
	if (values.length === 0) {
		return 0
	}
	return values.reduce((sum, value) => sum + value, 0) / values.length
}
