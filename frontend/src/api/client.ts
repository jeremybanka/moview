import { getRuntimeConfig } from "./runtime-config"
import type { AppState } from "./types"

type AddMovieInput = {
	groupId: string
	title: string
	userId: string
}

type QueueInput = {
	groupId: string
	movieId: string
	placement: `end` | `on_deck` | `second`
	userId: string
}

type RankInput = {
	advocateId: string
	afterAdvocateId?: string
	beforeAdvocateId?: string
}

type ReviewInput = {
	feelings?: string
	goodnessOfPick: number
	groupId: string
	movieId: string
	rating: number
	userId: string
}

export async function fetchAppState(
	input: {
		groupId?: string | null
		userId?: string | null
	} = {},
): Promise<AppState> {
	const params = new URLSearchParams()
	if (input.groupId) {
		params.set(`groupId`, input.groupId)
	}
	if (input.userId) {
		params.set(`userId`, input.userId)
	}
	const query = params.size > 0 ? `?${params.toString()}` : ``
	return request<AppState>(`/api/app-state${query}`)
}

export async function addMovie(input: AddMovieInput): Promise<AppState> {
	return request<AppState>(`/api/movies`, {
		body: JSON.stringify(input),
		method: `POST`,
	})
}

export async function placeQueue(input: QueueInput): Promise<AppState> {
	return request<AppState>(`/api/queue`, {
		body: JSON.stringify(input),
		method: `POST`,
	})
}

export async function returnQueue(queueEntryId: string): Promise<AppState> {
	return request<AppState>(`/api/queue/return`, {
		body: JSON.stringify({ queueEntryId }),
		method: `POST`,
	})
}

export async function movePersonalRank(input: RankInput): Promise<AppState> {
	return request<AppState>(`/api/personal-rank`, {
		body: JSON.stringify(input),
		method: `POST`,
	})
}

export async function submitReview(input: ReviewInput): Promise<AppState> {
	return request<AppState>(`/api/reviews`, {
		body: JSON.stringify(input),
		method: `POST`,
	})
}

export async function createGroup(input: {
	creatorUserId: string
	name: string
}): Promise<AppState> {
	return request<AppState>(`/api/groups`, {
		body: JSON.stringify(input),
		method: `POST`,
	})
}

export async function inviteUser(input: {
	groupId: string
	userId: string
}): Promise<AppState> {
	return request<AppState>(`/api/groups/invite`, {
		body: JSON.stringify(input),
		method: `POST`,
	})
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
	const token =
		typeof localStorage === `undefined`
			? null
			: localStorage.getItem(`moviewAccessToken`)
	const response = await fetch(resolveApiUrl(path), {
		...init,
		headers: {
			...(token ? { authorization: `Bearer ${token}` } : {}),
			"content-type": `application/json`,
			...init.headers,
		},
	})
	if (!response.ok) {
		const fallback = `Request failed with ${response.status}.`
		const error = await response.json().catch(() => ({ error: fallback }))
		throw new Error(typeof error.error === `string` ? error.error : fallback)
	}
	return (await response.json()) as T
}

function resolveApiUrl(path: string): string {
	const origin = getRuntimeConfig().MOVIEW_API_ORIGIN
	return origin ? new URL(path, origin).toString() : path
}
