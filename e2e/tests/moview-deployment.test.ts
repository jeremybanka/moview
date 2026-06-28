// cele2e-ci-unsafe: deploys Caddy, Authentik, and the Moview module in Docker.
import { spawnSync } from "node:child_process"
import { fileURLToPath } from "node:url"

import { expect, test } from "bun:test"
import { AUTHENTIK_DEPLOYMENT } from "@celilo/e2e"
import { chromium, type Locator, type Page } from "@playwright/test"

const moduleRoot = fileURLToPath(new URL(`../..`, import.meta.url))
const mountedModuleRoot = `/moview`
const publicOrigin = `https://www.iamtheinternet.org`

const bugRoutes = [
	{ expectedText: `Moira and Bug Pool`, pathname: `/pool` },
	{ expectedText: `Queue`, pathname: `/queue` },
	{ expectedText: `Bug`, pathname: `/personal` },
	{ expectedText: `Reviews`, pathname: `/reviews` },
	{ expectedText: `History`, pathname: `/history` },
	{ expectedText: `moview-moira-bug`, pathname: `/groups` },
	{ expectedText: `Authentik`, pathname: `/login` },
] as const

test("deploys Moview with Caddy and Authentik smoke-test access", async () => {
	const build = spawnSync(`bun`, [`run`, `build`], {
		cwd: moduleRoot,
		encoding: `utf8`,
	})
	expect(build.status, build.stdout + build.stderr).toBe(0)

	const net = await AUTHENTIK_DEPLOYMENT()
		.app({ moview: `10.0.20.40` })
		.mount(moduleRoot, mountedModuleRoot)
		.start()

	try {
		await net.celilo(
			[
				`system init --accept-defaults`,
				`network.dmz.subnet=10.0.10.0/24`,
				`network.app.subnet=10.0.20.0/24`,
				`network.secure.subnet=10.0.30.0/24`,
				`network.internal.subnet=192.168.0.0/24`,
				`primary_domain=iamtheinternet.org`,
				`admin.email=admin@iamtheinternet.org`,
				`dns.primary=100.100.0.1`,
				`dns.fallback=1.0.0.1,8.8.8.8`,
			].join(` `),
		)

		await net.celilo(`module import namecheap`)
		await net.celilo(`module import greenwave`)
		await net.celilo(`module import iptables`)
		await net.celilo(`module import caddy`)
		await net.celilo(`module import authentik`)

		await net.celilo(
			`machine add 192.168.0.1 --ssh-user root --earmark greenwave`,
		)
		await net.celilo(
			`machine add 192.168.0.254 --ssh-user root --earmark iptables`,
		)
		await net.celilo(`machine add 10.0.10.10 --ssh-user root --earmark caddy`)
		await net.celilo(
			`machine add 10.0.20.30 --ssh-user root --earmark authentik`,
		)
		await net.celilo(`machine add 10.0.20.40 --ssh-user root --earmark moview`)

		await net.celilo(
			`module config set namecheap domains '["iamtheinternet.org"]'`,
		)
		await net.celilo(
			`module secret set namecheap ddns_passwords '{"iamtheinternet.org":"test123"}'`,
		)
		await net.celilo(`module config set greenwave router_ip 192.168.0.1`)
		await net.celilo(`module secret set greenwave router_username admin`)
		await net.celilo(`module secret set greenwave router_password admin`)
		await net.celilo(`module config set iptables nat_ip 192.168.0.253`)
		await net.celilo(`module config set caddy hostname www`)
		await net.configureAcme()

		await net.celilo(`module deploy namecheap --no-interactive`, 300_000)
		await net.celilo(`module deploy greenwave --no-interactive`, 300_000)
		await net.celilo(`module deploy iptables --no-interactive`, 300_000)
		await net.celilo(`module deploy caddy --no-interactive`, 300_000)
		await net.celilo(`module deploy authentik --no-interactive`, 600_000)

		await net.celilo(`module import ${mountedModuleRoot}`)
		await net.celilo(
			`module config set moview public_hostname www.iamtheinternet.org`,
		)
		await net.celilo(`module config set moview service_port 3001`)
		await net.celilo(
			`module config set moview smoke_test_group_slug moview-moira-bug`,
		)
		await net.celilo(`module config set moview admin_group_slug moview-bmn`)
		await net.celilo(`module config set moview smoke_test_username bug`)
		await net.celilo(`module config set moview smoke_test_email bug@moview.com`)
		await net.celilo(`module config set moview admin_username jeremy`)
		await net.celilo(`module config set moview admin_email jeremy@moview.com`)
		await net.celilo(`module deploy moview --no-interactive`, 600_000)

		const publicHome = await net.exec(
			`fw-ext`,
			`curl -fsS ${publicOrigin}/`,
			120_000,
		)
		expect(publicHome.stdout).toContain(`Moview`)

		const health = await net.exec(
			`fw-ext`,
			`curl -fsS ${publicOrigin}/api/health`,
			120_000,
		)
		expect(health.stdout).toContain(`"ok":true`)

		const bugAccessJwt = unsignedJwt({
			groups: [`moview-moira-bug`],
			iss: `https://auth.iamtheinternet.org/application/o/moview/`,
			preferred_username: `bug`,
			sub: `authentik|bug`,
		})
		const bugState = await net.exec(
			`fw-ext`,
			`curl -fsS -H 'authorization: Bearer ${bugAccessJwt}' '${publicOrigin}/api/app-state?groupId=group-moira-bug'`,
			120_000,
		)
		expect(bugState.stdout).toContain(`"displayName":"Bug"`)
		expect(bugState.stdout).toContain(`"name":"Moira and Bug"`)

		const smokePassword = (
			await net.celilo(`module secret get moview smoke_test_password`)
		).stdout.trim()
		expect(smokePassword.length).toBeGreaterThan(0)
		const browserHandle = await net.browser({
			chromium,
			vantage: `isp-external`,
		})
		try {
			const browser = browserHandle.browser as Awaited<
				ReturnType<typeof chromium.launch>
			>
			const context = await browser.newContext({ ignoreHTTPSErrors: true })
			const page = await context.newPage()
			const consoleErrors: string[] = []

			page.on(`console`, (message) => {
				if (message.type() === `error`) {
					consoleErrors.push(message.text())
				}
			})
			page.on(`pageerror`, (error) => {
				consoleErrors.push(error.message)
			})

			await page.goto(`${publicOrigin}/login`)
			await page.getByRole(`button`, { name: /authentik/i }).click()
			await completeAuthentikLogin(page, `bug`, smokePassword)
			await page.waitForURL(`${publicOrigin}/pool`, { timeout: 120_000 })
			await visibleText(page, `Moira and Bug Pool`)
			expect(await page.getByLabel(`User`).inputValue()).toBe(`user-bug`)

			for (const route of bugRoutes) {
				await page.goto(`${publicOrigin}${route.pathname}`)
				await visibleText(page, route.expectedText)
				if (route.pathname !== `/login`) {
					expect(await page.getByLabel(`User`).inputValue()).toBe(`user-bug`)
				}
			}

			expect(consoleErrors).toEqual([])
			await context.close()
		} finally {
			await browserHandle.close()
		}
	} finally {
		await net.stop()
	}
}, 1_500_000)

async function completeAuthentikLogin(
	page: Page,
	username: string,
	password: string,
): Promise<void> {
	await page.waitForLoadState(`domcontentloaded`)
	await fillRequired(
		[
			page.getByLabel(/username|email/i),
			page.locator(`input[name="uidField"]`),
			page.locator(`input[name="username"]`),
			page.locator(`input[type="email"]`),
			page.locator(`input[type="text"]`),
		],
		username,
		`username`,
	)

	const passwordField = await firstVisible([
		page.getByLabel(/password/i),
		page.locator(`input[name="password"]`),
		page.locator(`input[type="password"]`),
	])
	if (!passwordField) {
		await submitLoginStage(page)
		await fillRequired(
			[
				page.getByLabel(/password/i),
				page.locator(`input[name="password"]`),
				page.locator(`input[type="password"]`),
			],
			password,
			`password`,
		)
	} else {
		await passwordField.fill(password)
	}

	await submitLoginStage(page)
	await clickIfVisible([
		page.getByRole(`button`, { name: /allow|authorize|continue/i }),
		page.locator(`button[type="submit"]`),
	])
}

async function fillRequired(
	locators: Locator[],
	value: string,
	name: string,
): Promise<void> {
	const locator = await firstVisible(locators)
	if (!locator) {
		throw new Error(`Could not find Authentik ${name} field.`)
	}
	await locator.fill(value)
}

async function firstVisible(locators: Locator[]): Promise<Locator | null> {
	for (const locator of locators) {
		const count = await locator.count()
		for (let index = 0; index < count; index += 1) {
			const candidate = locator.nth(index)
			if ((await candidate.isVisible()) && (await candidate.isEnabled())) {
				return candidate
			}
		}
	}
	return null
}

async function submitLoginStage(page: Page): Promise<void> {
	const clicked = await clickIfVisible([
		page.getByRole(`button`, { name: /continue|sign in|login|log in|submit/i }),
		page.locator(`button[type="submit"]`),
		page.locator(`input[type="submit"]`),
	])
	if (!clicked) {
		throw new Error(`Could not find Authentik submit button.`)
	}
	await page.waitForLoadState(`domcontentloaded`).catch(() => undefined)
}

async function clickIfVisible(locators: Locator[]): Promise<boolean> {
	const locator = await firstVisible(locators)
	if (!locator) {
		return false
	}
	await locator.click()
	return true
}

async function visibleText(page: Page, text: string): Promise<void> {
	await page.getByText(text).first().waitFor({
		state: `visible`,
		timeout: 120_000,
	})
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
