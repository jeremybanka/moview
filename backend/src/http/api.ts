import type { z } from "zod"
import { ZodError } from "zod"

import {
	assertGroupAccess,
	getRequestAuth,
	HttpResponseError,
} from "../auth/access-jwt"
import { resetDatabase } from "../db/client"
import {
	addMovieRequestSchema,
	addQueueEntryRequestSchema,
	createGroupRequestSchema,
	inviteUserRequestSchema,
	returnQueueEntryRequestSchema,
	reviewRequestSchema,
	updatePersonalRankRequestSchema,
} from "../db/schemas"
import { seedDevData } from "../db/seed"
import {
	addMovieToGroup,
	createGroup,
	getAppState,
	inviteUser,
	placeQueueEntry,
	returnQueueEntry,
	submitReview,
	updatePersonalRank,
} from "../domain/app-state"
import { env } from "../env"

type Schema<T> = z.ZodType<T>

export async function handleApi(request: Request): Promise<Response> {
	if (request.method === `OPTIONS`) {
		return new Response(null, { headers: corsHeaders() })
	}

	try {
		const url = new URL(request.url)
		if (!url.pathname.startsWith(`/api`)) {
			return json({ error: `Not found.` }, { status: 404 })
		}

		if (request.method === `GET` && url.pathname === `/api/health`) {
			return json({ ok: true })
		}

		if (request.method === `POST` && url.pathname === `/api/dev/reset`) {
			if (env.MOVIEW_MODE === `production`) {
				return json({ error: `Not found.` }, { status: 404 })
			}
			resetDatabase()
			await seedDevData()
			return json({ ok: true })
		}

		const auth = getRequestAuth(request)

		if (request.method === `GET` && url.pathname === `/api/app-state`) {
			const groupId = url.searchParams.get(`groupId`)
			if (groupId) {
				assertGroupAccess(auth, groupId)
			}
			return json(
				getAppState({
					groupId,
					userId: auth.user?.id ?? url.searchParams.get(`userId`),
				}),
			)
		}

		if (request.method === `POST` && url.pathname === `/api/movies`) {
			const input = await readJson(request, addMovieRequestSchema)
			assertGroupAccess(auth, input.groupId)
			return json(
				addMovieToGroup({
					...input,
					userId: auth.user?.id ?? input.userId,
				}),
			)
		}

		if (request.method === `POST` && url.pathname === `/api/queue`) {
			const input = await readJson(request, addQueueEntryRequestSchema)
			assertGroupAccess(auth, input.groupId)
			return json(
				placeQueueEntry({
					...input,
					userId: auth.user?.id ?? input.userId,
				}),
			)
		}

		if (request.method === `POST` && url.pathname === `/api/queue/return`) {
			const input = await readJson(request, returnQueueEntryRequestSchema)
			return json(returnQueueEntry({ ...input, userId: auth.user?.id }))
		}

		if (request.method === `POST` && url.pathname === `/api/personal-rank`) {
			const input = await readJson(request, updatePersonalRankRequestSchema)
			return json(updatePersonalRank(input))
		}

		if (request.method === `POST` && url.pathname === `/api/groups`) {
			const input = await readJson(request, createGroupRequestSchema)
			return json(
				createGroup({
					...input,
					creatorUserId: auth.user?.id ?? input.creatorUserId,
				}),
			)
		}

		if (request.method === `POST` && url.pathname === `/api/groups/invite`) {
			const input = await readJson(request, inviteUserRequestSchema)
			assertGroupAccess(auth, input.groupId)
			return json(inviteUser(input))
		}

		if (request.method === `POST` && url.pathname === `/api/reviews`) {
			const input = await readJson(request, reviewRequestSchema)
			assertGroupAccess(auth, input.groupId)
			return json(
				submitReview({
					...input,
					userId: auth.user?.id ?? input.userId,
				}),
			)
		}

		return json({ error: `Not found.` }, { status: 404 })
	} catch (error) {
		if (error instanceof HttpResponseError) {
			return withCors(error.response)
		}
		if (error instanceof ZodError) {
			return json(
				{ error: `Invalid request.`, issues: error.issues },
				{ status: 400 },
			)
		}
		const message = error instanceof Error ? error.message : `Unknown error.`
		return json({ error: message }, { status: 500 })
	}
}

async function readJson<T>(request: Request, schema: Schema<T>): Promise<T> {
	const body = await request.json()
	return schema.parse(body)
}

function json(data: unknown, init: ResponseInit = {}): Response {
	return new Response(JSON.stringify(data), {
		...init,
		headers: {
			...corsHeaders(),
			"content-type": `application/json; charset=utf-8`,
			...init.headers,
		},
	})
}

function withCors(response: Response): Response {
	const headers = new Headers(response.headers)
	for (const [key, value] of Object.entries(corsHeaders())) {
		headers.set(key, value)
	}
	return new Response(response.body, {
		headers,
		status: response.status,
		statusText: response.statusText,
	})
}

function corsHeaders(): Record<string, string> {
	return {
		"access-control-allow-headers": `authorization, content-type`,
		"access-control-allow-methods": `GET, POST, OPTIONS`,
		"access-control-allow-origin": `*`,
	}
}
