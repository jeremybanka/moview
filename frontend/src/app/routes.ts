import { atom, selector, setState } from "atom.io"
import type { Join, Tree, TreePath } from "treetrunks"
import { isTreePath, optional, required } from "treetrunks"

import { snapshotAtom } from "./state"

export const ROUTES = optional({
	groups: optional({
		new: null,
		$groupId: optional({
			pool: optional({
				add: null,
				$movieId: null,
			}),
			personal: null,
			queue: null,
			turns: null,
			invites: null,
			review: required({
				$movieNightId: optional({
					summary: null,
				}),
			}),
			history: null,
		}),
	}),
}) satisfies Tree

type RoutePath = TreePath<typeof ROUTES>
export type Route = Readonly<RoutePath>
export type Pathname = `/${Join<RoutePath, `/`>}`
export type PathnameWithSearch = `${Pathname}?${string}`
export type CurrentRoute = Route | 404
export type NavItem =
	| `dashboard`
	| `pool`
	| `personal`
	| `queue`
	| `turns`
	| `invites`
	| `review`
	| `history`
	| `groups`

export interface RouteParams {
	groupId: string | null
	movieId: string | null
	movieNightId: string | null
}

export interface Breadcrumb {
	href: Pathname
	label: string
}

export const pathnameAtom = atom<Pathname | (string & {})>({
	default: () => typeof window === `undefined` ? `/` : window.location.pathname,
	effects: [
		({ setSelf }) => {
			if (typeof document === `undefined` || typeof window === `undefined`) {
				return
			}
			document.addEventListener(`click`, (event) => {
				if (event.defaultPrevented) {
					return
				}
				if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
					return
				}
				const anchor = (event.target as HTMLElement).closest(`a`)
				if (!(anchor instanceof HTMLAnchorElement)) {
					return
				}
				const href = anchor.getAttribute(`href`)
				if (!href?.startsWith(`/`) || href.startsWith(`//`)) {
					return
				}
				if (anchor.target && anchor.target !== `_self`) {
					return
				}
				event.preventDefault()
				history.pushState(null, ``, href)
				setSelf(window.location.pathname as Pathname)
			})
			window.addEventListener(`popstate`, () => {
				setSelf(window.location.pathname as Pathname)
			})
		},
	],
	key: `pathname`,
})

export const routeSelector = selector<CurrentRoute>({
	get: ({ get }) => {
		const snapshot = get(snapshotAtom)
		const route = routeFromPathname(get(pathnameAtom))
		if (route === 404) {
			return 404
		}
		if (route.length === 0) {
			const firstGroup = snapshot.groups[0]
			return firstGroup ? [`groups`, firstGroup.id] : []
		}
		return route
	},
	key: `route`,
})

export const routeParamsSelector = selector<RouteParams>({
	get: ({ get }) => routeParamsFromRoute(get(routeSelector)),
	key: `routeParams`,
})

export const routeGroupIdSelector = selector<string | null>({
	get: ({ get }) => get(routeParamsSelector).groupId,
	key: `routeGroupId`,
})

export const routeMovieIdSelector = selector<string | null>({
	get: ({ get }) => get(routeParamsSelector).movieId,
	key: `routeMovieId`,
})

export const routeMovieNightIdSelector = selector<string | null>({
	get: ({ get }) => get(routeParamsSelector).movieNightId,
	key: `routeMovieNightId`,
})

export const currentNavItemSelector = selector<NavItem>({
	get: ({ get }) => navItemFromRoute(get(routeSelector)),
	key: `currentNavItem`,
})

export const breadcrumbsSelector = selector<Breadcrumb[]>({
	get: ({ get }) => {
		const snapshot = get(snapshotAtom)
		const route = get(routeSelector)
		const params = routeParamsFromRoute(route)
		if (route === 404) {
			return [{ href: `/`, label: `Moview` }]
		}
		if (!params.groupId) {
			return [{ href: `/`, label: `Groups` }]
		}
		const group = snapshot.groups.find((candidate) => candidate.id === params.groupId)
		const crumbs: Breadcrumb[] = [
			{ href: `/groups/${params.groupId}` as Pathname, label: group?.name ?? `Group` },
		]
		const navItem = navItemFromRoute(route)
		if (navItem !== `dashboard`) {
			crumbs.push({
				href: pathnameFromRoute(route),
				label: pageTitleFromRoute(route),
			})
		}
		return crumbs
	},
	key: `breadcrumbs`,
})

export const pageTitleSelector = selector<string>({
	get: ({ get }) => pageTitleFromRoute(get(routeSelector)),
	key: `pageTitle`,
})

export function isRoute(path: unknown[]): path is RoutePath {
	return isTreePath(ROUTES, path)
}

export function navigate(pathname: Pathname | PathnameWithSearch): void {
	if (typeof window !== `undefined`) {
		history.pushState(null, ``, pathname)
	}
	setState(pathnameAtom, pathname.split(`?`)[0] as Pathname)
}

export function routeFromPathname(pathname: string): CurrentRoute {
	const path = pathname
		.split(`?`)[0]
		.split(`/`)
		.slice(1)
		.filter(Boolean)
		.map((segment) => decodeURIComponent(segment))
	if (!isRoute(path)) {
		return 404
	}
	return path
}

export function routeParamsFromRoute(route: CurrentRoute): RouteParams {
	if (route === 404) {
		return { groupId: null, movieId: null, movieNightId: null }
	}
	const groupId = route[0] === `groups` && route[1] !== `new` ? route[1] ?? null : null
	const movieId = route[0] === `groups` && route[2] === `pool` && route[3] && route[3] !== `add`
		? route[3]
		: null
	const movieNightId = route[0] === `groups` && route[2] === `review` ? route[3] ?? null : null
	return { groupId, movieId, movieNightId }
}

export function navItemFromRoute(route: CurrentRoute): NavItem {
	if (route === 404) {
		return `dashboard`
	}
	if (route.length === 0 || route[0] !== `groups`) {
		return `dashboard`
	}
	if (route[1] === `new`) {
		return `groups`
	}
	const segment = route[2]
	if (!segment) {
		return `dashboard`
	}
	if (segment === `pool` || segment === `personal` || segment === `queue` || segment === `turns` || segment === `invites` || segment === `history`) {
		return segment
	}
	if (segment === `review`) {
		return `review`
	}
	return `dashboard`
}

export function pageTitleFromRoute(route: CurrentRoute): string {
	const navItem = navItemFromRoute(route)
	if (route === 404) {
		return `Not found`
	}
	if (route[0] === `groups` && route[1] === `new`) {
		return `New group`
	}
	if (route[0] === `groups` && route[2] === `pool` && route[3] === `add`) {
		return `Add movie`
	}
	if (route[0] === `groups` && route[2] === `pool` && route[3]) {
		return `Movie details`
	}
	if (route[0] === `groups` && route[2] === `review` && route[4] === `summary`) {
		return `Review summary`
	}
	const labels = {
		dashboard: `Dashboard`,
		groups: `Groups`,
		history: `History`,
		invites: `Invites`,
		personal: `Personal`,
		pool: `Pool`,
		queue: `Queue`,
		review: `Review`,
		turns: `Turns`,
	} satisfies Record<NavItem, string>
	return labels[navItem]
}

export function pathnameFromRoute(route: Route): Pathname {
	return `/${route.map((segment) => encodeURIComponent(segment)).join(`/`)}` as Pathname
}
