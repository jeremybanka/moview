import { existsSync, statSync } from "node:fs"
import { readFile } from "node:fs/promises"
import { extname, join } from "node:path"
import { fileURLToPath } from "node:url"

import { expect, test } from "@playwright/test"

import {
	createBugAppState,
	mintBugUserInAuthentik,
} from "../src/test/bug-app-state"

const frontendDir = fileURLToPath(new URL(`..`, import.meta.url))
const distDir = join(frontendDir, `dist`)
const indexPath = join(distDir, `index.html`)

const routes = [
	{ expectedText: `Moira and Bug Pool`, pathname: `/pool` },
	{ expectedText: `Queue`, pathname: `/queue` },
	{ expectedText: `1 advocated titles`, pathname: `/personal` },
	{ expectedText: `Reviews`, pathname: `/reviews` },
	{ expectedText: `History`, pathname: `/history` },
	{ expectedText: `moview-moira-bug`, pathname: `/groups` },
	{ expectedText: `Dev Login`, pathname: `/login` },
] as const

test(`minted Bug user can log in, visit every route, and produce no console errors`, async ({
	page,
}) => {
	const state = createBugAppState()
	const mintedBug = mintBugUserInAuthentik()
	const consoleErrors: string[] = []

	expect(mintedBug.user.id).toBe(`user-bug`)
	expect(mintedBug.groups).toContain(`moview-moira-bug`)

	page.on(`console`, (message) => {
		if (message.type() === `error`) {
			consoleErrors.push(message.text())
		}
	})
	page.on(`pageerror`, (error) => {
		consoleErrors.push(error.message)
	})

	await page.route(`**/*`, async (route) => {
		const url = new URL(route.request().url())
		if (url.pathname === `/api/app-state`) {
			await route.fulfill({
				contentType: `application/json`,
				json: state,
			})
			return
		}
		if (url.pathname === `/api/dev/reset`) {
			await route.fulfill({
				contentType: `application/json`,
				json: { ok: true },
			})
			return
		}
		if (url.pathname.startsWith(`/assets/`)) {
			await route.fulfill({
				contentType: contentTypeFor(url.pathname),
				path: join(distDir, url.pathname),
			})
			return
		}
		const staticPath = join(distDir, url.pathname)
		if (existsSync(staticPath) && statSync(staticPath).isFile()) {
			await route.fulfill({
				contentType: contentTypeFor(url.pathname),
				path: staticPath,
			})
			return
		}
		if (url.pathname === `/favicon.svg`) {
			await route.fulfill({
				contentType: `image/svg+xml`,
				path: join(frontendDir, `public/favicon.svg`),
			})
			return
		}
		await route.fulfill({
			body: await readFile(indexPath, `utf8`),
			contentType: `text/html`,
		})
	})

	for (const route of routes) {
		await page.goto(`http://moview.test${route.pathname}`)
		await expect(page.getByText(route.expectedText).first()).toBeVisible()
		await expect(page.getByLabel(`User`)).toHaveValue(`user-bug`)
	}

	expect(consoleErrors).toEqual([])
})

function contentTypeFor(pathname: string): string {
	switch (extname(pathname)) {
		case `.css`:
			return `text/css`
		case `.js`:
			return `text/javascript`
		case `.svg`:
			return `image/svg+xml`
		default:
			return `application/octet-stream`
	}
}
