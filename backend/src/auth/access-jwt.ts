import { eq } from "drizzle-orm"

import { db } from "../db/client"
import { groups, type User, users } from "../db/schema"
import { env } from "../env"

type AuthentikAccessClaims = {
	email?: string
	groups?: string[]
	iss?: string
	name?: string
	preferred_username?: string
	sub?: string
}

export type RequestAuth = {
	groups: string[]
	mode: `dev` | `jwt`
	user: User | null
}

export type RequestAuthConfig = {
	authentikIssuer?: string
	mode: `dev` | `production` | `test`
}

export class HttpResponseError extends Error {
	public constructor(
		message: string,
		public readonly response: Response,
	) {
		super(message)
		this.name = `HttpResponseError`
	}
}

export function getRequestAuth(request: Request): RequestAuth {
	return getRequestAuthForConfig(request, {
		authentikIssuer: env.AUTHENTIK_ISSUER,
		mode: env.MOVIEW_MODE,
	})
}

export function getRequestAuthForConfig(
	request: Request,
	config: RequestAuthConfig,
): RequestAuth {
	if (config.mode === `dev`) {
		return {
			groups: [],
			mode: `dev`,
			user: null,
		}
	}

	const token = getBearerToken(request)
	if (!token) {
		throw httpError(`Missing Access JWT.`, 401)
	}
	const claims = decodeAccessClaims(token)
	if (!claims.sub) {
		throw httpError(`Access JWT is missing a subject.`, 401)
	}
	if (!config.authentikIssuer || claims.iss !== config.authentikIssuer) {
		throw httpError(`Access JWT issuer is not accepted.`, 401)
	}
	const user = findUserForClaims(claims)
	if (!user) {
		throw httpError(`Access JWT subject is not a Moview user.`, 403)
	}
	return {
		groups: claims.groups ?? [],
		mode: `jwt`,
		user,
	}
}

export function assertGroupAccess(auth: RequestAuth, groupId: string): void {
	if (auth.mode === `dev`) {
		return
	}
	const group = db.select().from(groups).where(eq(groups.id, groupId)).get()
	if (!group) {
		throw httpError(`Group not found.`, 404)
	}
	if (!auth.groups.includes(group.authentikGroupSlug)) {
		throw httpError(`Access JWT does not include the group.`, 403)
	}
}

function findUserForClaims(claims: AuthentikAccessClaims): User | null {
	if (!claims.sub) {
		return null
	}
	const subjectUser = db
		.select()
		.from(users)
		.where(eq(users.authentikSubject, claims.sub))
		.get()
	if (subjectUser) {
		return subjectUser
	}

	const candidates = usernameCandidates(claims)
	if (candidates.size === 0) {
		return null
	}
	return (
		db
			.select()
			.from(users)
			.all()
			.find((user) => {
				const subject = user.authentikSubject.replace(/^authentik\|/, ``)
				return (
					candidates.has(subject) ||
					candidates.has(user.faceTag) ||
					candidates.has(slugifyClaim(user.displayName))
				)
			}) ?? null
	)
}

function usernameCandidates(claims: AuthentikAccessClaims): Set<string> {
	const values = [
		claims.preferred_username,
		claims.name,
		claims.email?.split(`@`)[0],
	]
	return new Set(
		values
			.filter((value): value is string => typeof value === `string`)
			.map(slugifyClaim)
			.filter((value) => value.length > 0),
	)
}

function slugifyClaim(value: string): string {
	return value
		.trim()
		.toLowerCase()
		.replaceAll(/[^a-z0-9]+/g, `-`)
		.replaceAll(/^-|-$/g, ``)
}

function getBearerToken(request: Request): string | null {
	const authorization = request.headers.get(`authorization`)
	if (!authorization?.startsWith(`Bearer `)) {
		return null
	}
	return authorization.slice(`Bearer `.length)
}

function decodeAccessClaims(token: string): AuthentikAccessClaims {
	const [, payload] = token.split(`.`)
	if (!payload) {
		throw httpError(`Access JWT is malformed.`, 401)
	}
	const decoded = JSON.parse(
		Buffer.from(base64UrlToBase64(payload), `base64`).toString(`utf8`),
	) as unknown
	return isClaims(decoded) ? decoded : {}
}

function base64UrlToBase64(value: string): string {
	return value.replaceAll(`-`, `+`).replaceAll(`_`, `/`)
}

function isClaims(value: unknown): value is AuthentikAccessClaims {
	return typeof value === `object` && value !== null
}

function httpError(message: string, status: number): HttpResponseError {
	return new HttpResponseError(message, new Response(message, { status }))
}
