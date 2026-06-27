import { describe, expect, test } from "bun:test"

import {
	navItemFromRoute,
	routeFromPathname,
	routeParamsFromRoute,
} from "./routes"

describe(`Moview routes`, () => {
	test(`validates effective group routes`, () => {
		expect(routeFromPathname(`/groups/group-friends`)).toEqual([`groups`, `group-friends`])
		expect(routeFromPathname(`/groups/group-friends/pool`)).toEqual([`groups`, `group-friends`, `pool`])
		expect(routeFromPathname(`/groups/group-friends/pool/add`)).toEqual([`groups`, `group-friends`, `pool`, `add`])
		expect(routeFromPathname(`/groups/group-friends/pool/movie-dune`)).toEqual([`groups`, `group-friends`, `pool`, `movie-dune`])
		expect(routeFromPathname(`/groups/group-friends/review/night-everything`)).toEqual([`groups`, `group-friends`, `review`, `night-everything`])
		expect(routeFromPathname(`/groups/group-friends/review/night-everything/summary`)).toEqual([`groups`, `group-friends`, `review`, `night-everything`, `summary`])
		expect(routeFromPathname(`/groups/group-friends/history`)).toEqual([`groups`, `group-friends`, `history`])
	})

	test(`rejects invalid route shapes`, () => {
		expect(routeFromPathname(`/movies/movie-dune`)).toBe(404)
		expect(routeFromPathname(`/groups/group-friends/review`)).toBe(404)
		expect(routeFromPathname(`/groups/group-friends/queue/extra`)).toBe(404)
	})

	test(`extracts route params for selected group and review summary`, () => {
		const personalRoute = routeFromPathname(`/groups/group-friends/personal`)
		expect(routeParamsFromRoute(personalRoute)).toEqual({
			groupId: `group-friends`,
			movieId: null,
			movieNightId: null,
		})

		const summaryRoute = routeFromPathname(`/groups/group-friends/review/night-everything/summary`)
		expect(routeParamsFromRoute(summaryRoute)).toEqual({
			groupId: `group-friends`,
			movieId: null,
			movieNightId: `night-everything`,
		})
		expect(navItemFromRoute(summaryRoute)).toBe(`review`)
	})
})
