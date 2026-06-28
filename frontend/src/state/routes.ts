import { atom, selector, setState } from "atom.io"
import type { Join, TreePath } from "treetrunks"
import { isTreePath, optional } from "treetrunks"

export const ROUTES = optional({
	groups: null,
	history: null,
	login: null,
	personal: null,
	pool: null,
	queue: null,
	reviews: null,
})

export type Route = TreePath<typeof ROUTES>
export type Pathname = `/${Join<Route, `/`>}`
export type PathnameWithSearch = `${Pathname}?${string}`

export const pathnameAtom = atom<Pathname | (string & {})>({
	key: `pathname`,
	default: () => window.location.pathname,
	effects: [
		({ setSelf }) => {
			document.addEventListener(`click`, (event) => {
				const anchor = (event.target as HTMLElement).closest(`a`)
				if (!(anchor instanceof HTMLAnchorElement)) {
					return
				}

				const href = anchor.getAttribute(`href`)
				if (!href?.startsWith(`/`)) {
					return
				}

				event.preventDefault()
				history.pushState(null, ``, href)
				setSelf(window.location.pathname)
			})

			window.addEventListener(`popstate`, () => {
				setSelf(window.location.pathname)
			})
		},
	],
})

export const routeSelector = selector<Route | 404>({
	key: `route`,
	get: ({ get }) => {
		const pathname = get(pathnameAtom)
		const path = pathname.split(`/`).slice(1).filter(Boolean)
		if (!isRoute(path)) {
			return 404
		}
		if (path.length === 0) {
			return [`pool`]
		}
		return path
	},
})

export function navigate(pathname: Pathname | PathnameWithSearch): void {
	history.pushState(null, ``, pathname)
	setState(pathnameAtom, pathname.split(`?`)[0] as Pathname)
}

function isRoute(path: unknown[]): path is Route {
	return isTreePath(ROUTES, path)
}
