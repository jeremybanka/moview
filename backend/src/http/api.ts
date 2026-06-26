import { and, asc, desc, eq, inArray } from "drizzle-orm"

import { db } from "../db/client"
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
} from "../db/schema"
import { assertGroupAccess, authContextFromRequest } from "../domain/auth"
import { positionForPlacement, type QueuePlacement } from "../domain/queue"
import { moveRank, nextWholeRank } from "../domain/rank"
import { env } from "../env"

function json(data: unknown, init?: ResponseInit): Response {
	return Response.json(data, {
		headers: { "access-control-allow-origin": env.APP_ORIGIN },
		...init,
	})
}

function id(prefix: string): string {
	return `${prefix}-${crypto.randomUUID()}`
}

async function readJson<T>(request: Request): Promise<T> {
	return (await request.json()) as T
}

async function groupForAccess(request: Request, groupId: string) {
	const auth = authContextFromRequest(request)
	const group = (
		await db.select().from(groups).where(eq(groups.id, groupId)).limit(1)
	)[0]
	if (!group) {
		throw new Response(`Group not found`, { status: 404 })
	}
	assertGroupAccess(auth, group.authentikGroup)
	return { auth, group }
}

async function bootstrap(request: Request): Promise<Response> {
	const auth = authContextFromRequest(request)
	const groupRows =
		auth.mode === `dev`
			? await db.select().from(groups).orderBy(asc(groups.createdAt))
			: await db
					.select()
					.from(groups)
					.where(inArray(groups.authentikGroup, auth.groups))
					.orderBy(asc(groups.createdAt))
	const selectedGroup = groupRows[0]
	if (!selectedGroup) {
		return json({ groups: [], users: [] })
	}
	return json(await groupDashboard(selectedGroup.id))
}

async function groupDashboard(groupId: string) {
	const groupList = await db.select().from(groups).orderBy(asc(groups.createdAt))
	const memberRows = await db
		.select({
			avatarColor: users.avatarColor,
			displayName: users.displayName,
			email: users.email,
			id: users.id,
			role: memberships.role,
		})
		.from(memberships)
		.innerJoin(users, eq(memberships.userId, users.id))
		.where(eq(memberships.groupId, groupId))
		.orderBy(asc(users.displayName))
	const advocateRows = await db
		.select({
			advocateNumber: advocates.advocateNumber,
			id: advocates.id,
			movieId: advocates.movieId,
			rank: advocates.rank,
			userId: advocates.userId,
		})
		.from(advocates)
		.where(eq(advocates.groupId, groupId))
		.orderBy(asc(advocates.rank))
	const movieIds = [...new Set(advocateRows.map((advocate) => advocate.movieId))]
	const movieRows =
		movieIds.length > 0
			? await db.select().from(movies).where(inArray(movies.id, movieIds))
			: []
	const queuedRows = await db
		.select({
			addedByUserId: queueEntries.addedByUserId,
			id: queueEntries.id,
			movieId: queueEntries.movieId,
			position: queueEntries.position,
		})
		.from(queueEntries)
		.where(
			and(eq(queueEntries.groupId, groupId), eq(queueEntries.status, `queued`)),
		)
		.orderBy(asc(queueEntries.position))
	const turnRows = await db
		.select({
			id: turnOrderEntries.id,
			position: turnOrderEntries.position,
			userId: turnOrderEntries.userId,
		})
		.from(turnOrderEntries)
		.where(eq(turnOrderEntries.groupId, groupId))
		.orderBy(asc(turnOrderEntries.position))
	const historyRows = await historyForGroup(groupId, `date_watched`)
	return {
		advocates: advocateRows,
		groups: groupList,
		history: historyRows,
		members: memberRows,
		movies: movieRows,
		queue: queuedRows,
		selectedGroupId: groupId,
		turnOrder: turnRows,
	}
}

async function historyForGroup(groupId: string, sort: string) {
	const rows = await db
		.select({
			dateWatched: movieNights.dateWatched,
			feelings: individualReviews.feelings,
			goodnessOfPick: groupReviews.goodnessOfPick,
			groupId: movieNights.groupId,
			movieId: movies.id,
			movieNightId: movieNights.id,
			rating: individualReviews.rating,
			reviewerId: individualReviews.userId,
			title: movies.title,
			year: movies.year,
		})
		.from(movieNights)
		.innerJoin(movies, eq(movieNights.movieId, movies.id))
		.leftJoin(
			individualReviews,
			eq(individualReviews.movieNightId, movieNights.id),
		)
		.leftJoin(
			groupReviews,
			and(
				eq(groupReviews.movieNightId, movieNights.id),
				eq(groupReviews.userId, individualReviews.userId),
			),
		)
		.where(eq(movieNights.groupId, groupId))
		.orderBy(
			sort === `date_watched`
				? desc(movieNights.dateWatched)
				: asc(movies.title),
		)
	return rows
}

async function addMovie(request: Request, groupId: string): Promise<Response> {
	const { auth } = await groupForAccess(request, groupId)
	const body = await readJson<{
		description?: string
		posterPath?: string
		sourceId?: string
		title: string
		userId?: string
		year?: number
	}>(request)
	const userId = body.userId ?? auth.userId
	const sourceId = body.sourceId ?? null
	let movie = sourceId
		? (
				await db
					.select()
					.from(movies)
					.where(
						and(
							eq(movies.metadataSource, `tmdb`),
							eq(movies.sourceId, sourceId),
						),
					)
					.limit(1)
			)[0]
		: undefined
	if (!movie) {
		const movieId = id(`movie`)
		await db.insert(movies).values({
			description: body.description ?? null,
			id: movieId,
			metadataSource: sourceId ? `tmdb` : `manual`,
			posterPath: body.posterPath ?? null,
			sourceId,
			title: body.title,
			year: body.year ?? null,
		})
		movie = (
			await db.select().from(movies).where(eq(movies.id, movieId)).limit(1)
		)[0]
	}
	if (!movie) {
		throw new Response(`Movie could not be created`, { status: 500 })
	}
	const existingAdvocate = (
		await db
			.select()
			.from(advocates)
			.where(
				and(
					eq(advocates.groupId, groupId),
					eq(advocates.movieId, movie.id),
					eq(advocates.userId, userId),
				),
			)
			.limit(1)
	)[0]
	if (!existingAdvocate) {
		const siblingAdvocates = await db
			.select()
			.from(advocates)
			.where(
				and(eq(advocates.groupId, groupId), eq(advocates.movieId, movie.id)),
			)
		const personalRanks = await db
			.select({ rank: advocates.rank })
			.from(advocates)
			.where(and(eq(advocates.groupId, groupId), eq(advocates.userId, userId)))
		await db.insert(advocates).values({
			advocateNumber: siblingAdvocates.length + 1,
			groupId,
			id: id(`adv`),
			movieId: movie.id,
			rank: nextWholeRank(personalRanks.map((rank) => rank.rank)),
			userId,
		})
	}
	return json(await groupDashboard(groupId), { status: 201 })
}

async function queueMovie(request: Request, groupId: string): Promise<Response> {
	const { auth } = await groupForAccess(request, groupId)
	const body = await readJson<{
		movieId: string
		placement?: QueuePlacement
		userId?: string
	}>(request)
	const current = await db
		.select({ id: queueEntries.id, position: queueEntries.position })
		.from(queueEntries)
		.where(
			and(eq(queueEntries.groupId, groupId), eq(queueEntries.status, `queued`)),
		)
	const existing = (
		await db
			.select()
			.from(queueEntries)
			.where(
				and(
					eq(queueEntries.groupId, groupId),
					eq(queueEntries.movieId, body.movieId),
					eq(queueEntries.status, `queued`),
				),
			)
			.limit(1)
	)[0]
	const position = positionForPlacement(current, body.placement ?? `end`)
	if (existing) {
		await db
			.update(queueEntries)
			.set({ position })
			.where(eq(queueEntries.id, existing.id))
	} else {
		await db.insert(queueEntries).values({
			addedByUserId: body.userId ?? auth.userId,
			groupId,
			id: id(`queue`),
			movieId: body.movieId,
			position,
		})
	}
	return json(await groupDashboard(groupId))
}

async function returnQueueEntry(
	request: Request,
	groupId: string,
	queueEntryId: string,
): Promise<Response> {
	await groupForAccess(request, groupId)
	await db
		.update(queueEntries)
		.set({ status: `returned` })
		.where(eq(queueEntries.id, queueEntryId))
	return json(await groupDashboard(groupId))
}

async function movePersonalRank(
	request: Request,
	groupId: string,
): Promise<Response> {
	await groupForAccess(request, groupId)
	const body = await readJson<{
		advocateId: string
		targetIndex: number
		userId: string
	}>(request)
	const personal = await db
		.select({ id: advocates.id, rank: advocates.rank })
		.from(advocates)
		.where(
			and(eq(advocates.groupId, groupId), eq(advocates.userId, body.userId)),
		)
		.orderBy(asc(advocates.rank))
	const moving = personal.find((advocate) => advocate.id === body.advocateId)
	if (!moving) {
		throw new Response(`Advocate not found`, { status: 404 })
	}
	await db
		.update(advocates)
		.set({
			rank: moveRank(
				personal.map((advocate) => advocate.rank),
				body.targetIndex,
				moving.rank,
			),
		})
		.where(eq(advocates.id, body.advocateId))
	return json(await groupDashboard(groupId))
}

async function tmdbSearch(request: Request): Promise<Response> {
	const url = new URL(request.url)
	const query = url.searchParams.get(`query`)?.trim()
	if (!query) {
		return json({ results: [] })
	}
	if (!env.TMDB_API_KEY) {
		return json({ manualFallback: true, results: [] })
	}
	const response = await fetch(
		`https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(query)}`,
		{
			headers: { authorization: `Bearer ${env.TMDB_API_KEY}` },
		},
	)
	if (!response.ok) {
		return json({ manualFallback: true, results: [] })
	}
	const data = (await response.json()) as {
		results?: Array<{
			id: number
			overview?: string
			poster_path?: string
			release_date?: string
			title: string
		}>
	}
	return json({
		results: (data.results ?? []).slice(0, 8).map((movie) => ({
			description: movie.overview ?? null,
			posterPath: movie.poster_path
				? `https://image.tmdb.org/t/p/w342${movie.poster_path}`
				: null,
			sourceId: String(movie.id),
			title: movie.title,
			year: movie.release_date ? Number(movie.release_date.slice(0, 4)) : null,
		})),
	})
}

export async function handleApi(request: Request): Promise<Response> {
	try {
		const url = new URL(request.url)
		if (request.method === `OPTIONS`) {
			return json(null)
		}
		if (url.pathname === `/api/bootstrap`) {
			return await bootstrap(request)
		}
		if (url.pathname === `/api/tmdb/search`) {
			return await tmdbSearch(request)
		}
		const groupMatch = url.pathname.match(
			/^\/api\/groups\/([^/]+)(?:\/([^/]+))?(?:\/([^/]+))?$/,
		)
		if (!groupMatch) {
			return json({ error: `Not found` }, { status: 404 })
		}
		const [, groupId, resource, resourceId] = groupMatch
		if (!groupId) {
			return json({ error: `Group not found` }, { status: 404 })
		}
		if (request.method === `GET` && !resource) {
			await groupForAccess(request, groupId)
			return json(await groupDashboard(groupId))
		}
		if (request.method === `POST` && resource === `movies`) {
			return await addMovie(request, groupId)
		}
		if (request.method === `POST` && resource === `queue`) {
			return await queueMovie(request, groupId)
		}
		if (request.method === `DELETE` && resource === `queue` && resourceId) {
			return await returnQueueEntry(request, groupId, resourceId)
		}
		if (request.method === `POST` && resource === `personal-rank`) {
			return await movePersonalRank(request, groupId)
		}
		return json({ error: `Not found` }, { status: 404 })
	} catch (error) {
		if (error instanceof Response) {
			return error
		}
		const message = error instanceof Error ? error.message : `Unknown error`
		return json({ error: message }, { status: 500 })
	}
}
