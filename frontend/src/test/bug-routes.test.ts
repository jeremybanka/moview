import type { screen as domScreen } from "@testing-library/dom"
import { beforeAll, expect, test } from "bun:test"
import type { Tree } from "treetrunks"
import { isTreePath } from "treetrunks"

import type { Pathname } from "../state/routes"
import { createBugAppState, mintBugUserInAuthentik } from "./bug-app-state"
import { installDom } from "./setup-dom"

let screen: typeof domScreen
let routesTree: Tree

beforeAll(async () => {
	installDom()
	const domTestingLibrary = await import(`@testing-library/dom`)
	const routes = await import(`../state/routes`)
	screen = domTestingLibrary.screen
	routesTree = routes.ROUTES
})

test(`minted Bug user has Testing Library coverage for every route`, () => {
	const state = createBugAppState()
	const mintedBug = mintBugUserInAuthentik()

	expect(mintedBug.user.id).toBe(`user-bug`)
	expect(mintedBug.groups).toContain(state.activeGroup.authentikGroupSlug)

	document.body.innerHTML = `
		<main>
			<h1>${mintedBug.user.displayName}</h1>
			${routeExpectations
				.map((route) => `<a href="${route.pathname}">${route.expectedText}</a>`)
				.join(``)}
		</main>
	`

	expect(screen.getByRole(`heading`, { name: `Bug` })).toBeTruthy()
	for (const route of routeExpectations) {
		expect(isTreePath(routesTree, route.pathname.split(`/`).slice(1))).toBe(true)
		expect(screen.getByRole(`link`, { name: route.expectedText })).toBeTruthy()
	}
})

const routeExpectations: Array<{
	expectedText: string
	pathname: Pathname
}> = [
	{ expectedText: `Moira and Bug Pool`, pathname: `/pool` },
	{ expectedText: `Queue`, pathname: `/queue` },
	{ expectedText: `Bug Personal`, pathname: `/personal` },
	{ expectedText: `Reviews`, pathname: `/reviews` },
	{ expectedText: `History`, pathname: `/history` },
	{ expectedText: `moview-moira-bug`, pathname: `/groups` },
	{ expectedText: `Dev Login`, pathname: `/login` },
]
