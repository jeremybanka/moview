import { beforeAll, expect, test } from "bun:test"

import type { RequestAuth } from "../auth/access-jwt"
import type { AppState } from "./app-state"

type AppModule = {
	addMovieToGroup: (input: {
		groupId: string
		title: string
		userId: string
	}) => AppState
	getAppState: (input: { groupId: string; userId: string }) => AppState
	updatePersonalRank: (input: {
		advocateId: string
		afterAdvocateId?: string
		beforeAdvocateId?: string
	}) => AppState
}

type AuthModule = {
	HttpResponseError: new (
		message: string,
		response: Response,
	) => Error & { response: Response }
	assertGroupAccess: (auth: RequestAuth, groupId: string) => void
	getRequestAuthForConfig: (
		request: Request,
		config: {
			authentikIssuer?: string
			mode: `dev` | `production` | `test`
		},
	) => RequestAuth
}

let app: AppModule
let auth: AuthModule

beforeAll(async () => {
	Bun.env.DATABASE_URL = `:memory:`
	Bun.env.MOVIEW_MODE = `test`
	const client = await import(`../db/client`)
	const seed = await import(`../db/seed`)
	app = await import(`./app-state`)
	auth = await import(`../auth/access-jwt`)
	client.bootstrapSchema()
	client.resetDatabase()
	await seed.seedDevData()
})

test(`dev seed covers Jeremy's group pool, queue, turn order, and reviews`, () => {
	const state = app.getAppState({ groupId: `group-bmn`, userId: `user-jeremy` })
	expect(state.pool).toHaveLength(15)
	expect(state.queue).toHaveLength(14)
	expect(
		state.turnOrder.find((entry) => entry.isCurrent)?.user.displayName,
	).toBe(`Jeremy`)
	expect(state.history[0]?.averageRating).toBe(8)
	expect(state.history[0]?.averageGoodnessOfPick).toBe(4)
})

test(`Jeremy's first four personal ranks are whole-number seed ranks`, () => {
	const state = app.getAppState({ groupId: `group-bmn`, userId: `user-jeremy` })
	expect(state.personalPool.slice(0, 4).map((entry) => entry.rank)).toEqual([
		1, 2, 3, 4,
	])
})

test(`a duplicate group movie keeps Moira as contributor and Jeremy as advocate two`, () => {
	const state = app.addMovieToGroup({
		groupId: `group-bmn`,
		title: `Moonstruck`,
		userId: `user-jeremy`,
	})
	const moonstruck = state.pool.find(
		(entry) => entry.movie.title === `Moonstruck`,
	)
	expect(moonstruck?.contributor.displayName).toBe(`Moira`)
	expect(
		moonstruck?.advocates.find(
			(advocate) => advocate.user.displayName === `Jeremy`,
		)?.advocateNumber,
	).toBe(2)
})

test(`Peter's personal rank moves match the sparse-rank examples`, () => {
	const peter = app.getAppState({ groupId: `group-bmn`, userId: `user-peter` })
	const tiptoes = peter.personalPool.find(
		(entry) => entry.movie.title === `Tiptoes`,
	)
	const happily = peter.personalPool.find(
		(entry) => entry.movie.title === `Happily N'Ever After`,
	)
	const redBaron = peter.personalPool.find(
		(entry) => entry.movie.title === `The Red Baron`,
	)

	expect(tiptoes?.rank).toBe(63.1065076)
	expect(happily?.rank).toBe(103.463603701)
	expect(redBaron?.rank).toBe(12.130561)

	const afterTiptoesMove = app.updatePersonalRank({
		advocateId: tiptoes!.id,
		afterAdvocateId: happily!.id,
	})
	const movedTiptoes = afterTiptoesMove.personalPool.find(
		(entry) => entry.movie.title === `Tiptoes`,
	)
	expect(movedTiptoes?.rank).toBe(104)

	const afterRedBaronMove = app.updatePersonalRank({
		advocateId: redBaron!.id,
		afterAdvocateId: happily!.id,
		beforeAdvocateId: movedTiptoes!.id,
	})
	const movedRedBaron = afterRedBaronMove.personalPool.find(
		(entry) => entry.movie.title === `The Red Baron`,
	)
	expect(movedRedBaron?.rank).toBeCloseTo(103.7318018505)
})

test(`Moira can have a separate group with Bug invited`, () => {
	const state = app.getAppState({
		groupId: `group-moira-bug`,
		userId: `user-moira`,
	})
	expect(state.members.map((member) => member.user.displayName)).toEqual([
		`Bug`,
		`Moira`,
	])
	expect(
		state.members.find((member) => member.user.displayName === `Bug`)
			?.inviteStatus,
	).toBe(`invited`)
})

test(`production Access JWT maps Authentik Bug and enforces group access`, () => {
	const issuer = `https://authentik.moview.test/application/o/moview/`
	const requestAuth = auth.getRequestAuthForConfig(
		new Request(`https://moview.test/api/app-state`, {
			headers: {
				authorization: `Bearer ${unsignedJwt({
					groups: [`moview-moira-bug`],
					iss: issuer,
					preferred_username: `bug`,
					sub: `authentik|fresh-authentik-bug-subject`,
				})}`,
			},
		}),
		{
			authentikIssuer: issuer,
			mode: `production`,
		},
	)

	expect(requestAuth.mode).toBe(`jwt`)
	expect(requestAuth.user?.id).toBe(`user-bug`)
	expect(requestAuth.groups).toEqual([`moview-moira-bug`])
	expect(() => {
		auth.assertGroupAccess(requestAuth, `group-moira-bug`)
	}).not.toThrow()
	expectResponseError(() => {
		auth.assertGroupAccess(requestAuth, `group-bmn`)
	}, 403)
})

test(`production Access JWT rejects an unexpected issuer`, () => {
	expectResponseError(
		() =>
			auth.getRequestAuthForConfig(
				new Request(`https://moview.test/api/app-state`, {
					headers: {
						authorization: `Bearer ${unsignedJwt({
							groups: [`moview-moira-bug`],
							iss: `https://attacker.example/application/o/moview/`,
							preferred_username: `bug`,
							sub: `authentik|bug`,
						})}`,
					},
				}),
				{
					authentikIssuer: `https://authentik.moview.test/application/o/moview/`,
					mode: `production`,
				},
			),
		401,
	)
})

function expectResponseError(fn: () => void, status: number): void {
	try {
		fn()
		throw new Error(`Expected HTTP response error ${status}.`)
	} catch (error) {
		expect(error).toBeInstanceOf(auth.HttpResponseError)
		expect((error as { response: Response }).response.status).toBe(status)
	}
}

function unsignedJwt(payload: Record<string, unknown>): string {
	return [
		base64UrlJson({ alg: `none`, typ: `JWT` }),
		base64UrlJson(payload),
		``,
	].join(`.`)
}

function base64UrlJson(value: unknown): string {
	return Buffer.from(JSON.stringify(value), `utf8`)
		.toString(`base64`)
		.replaceAll(`+`, `-`)
		.replaceAll(`/`, `_`)
		.replaceAll(`=`, ``)
}
