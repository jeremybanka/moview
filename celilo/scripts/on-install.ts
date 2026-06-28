import { existsSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

import { defineHook } from "@celilo/capabilities"

type MoviewConfig = {
	admin_group_slug: string
	admin_email: string
	admin_username: string
	authentik_auth_url: string
	public_hostname: string
	service_port: number
	smoke_test_email: string
	smoke_test_group_slug: string
	smoke_test_username: string
}

type RequiredCapabilities = readonly [`public_web`, `idp`]

export default defineHook<MoviewConfig, RequiredCapabilities, [], `on_install`>({
	hook: `on_install`,
	requires: [`public_web`, `idp`] as const,
	handler: async ({ capabilities, config, logger, secrets, systems }) => {
		const system = systems[0]
		if (!system) {
			throw new Error(`Moview requires one deployed app-zone system.`)
		}

		const hostname = requireString(config.public_hostname, `public_hostname`)
		const servicePort = requirePort(config.service_port, `service_port`)
		const smokeTestGroupSlug = requireString(
			config.smoke_test_group_slug,
			`smoke_test_group_slug`,
		)
		const adminGroupSlug = requireString(
			config.admin_group_slug,
			`admin_group_slug`,
		)
		const clientGroupSlugs = [...new Set([smokeTestGroupSlug, adminGroupSlug])]
		const baseUrl = `https://${hostname}`
		const moduleRoot = resolve(dirname(fileURLToPath(import.meta.url)), `../..`)
		const frontendDist = resolve(moduleRoot, `frontend/dist`)

		if (!existsSync(frontendDist)) {
			throw new Error(
				`Frontend build artifact is missing at ${frontendDist}. Run the module build first.`,
			)
		}

		logger.info(`Creating Moview OIDC client in Authentik.`)
		const oidcClient = await capabilities.idp.create_oidc_client({
			client_name: `Moview`,
			client_type: `public`,
			groups: clientGroupSlugs,
			redirect_uris: [`${baseUrl}/login`, `${baseUrl}/`],
			scopes: [`openid`, `profile`, `email`, `groups`],
		})

		logger.info(`Creating smoke-test and first-admin users in Authentik.`)
		await capabilities.idp.create_user({
			email: requireString(config.smoke_test_email, `smoke_test_email`),
			groups: [smokeTestGroupSlug],
			password: requireSecret(
				secrets.smoke_test_password,
				`smoke_test_password`,
			),
			username: requireString(config.smoke_test_username, `smoke_test_username`),
		})
		await capabilities.idp.create_user({
			email: requireString(config.admin_email, `admin_email`),
			groups: [adminGroupSlug],
			password: requireSecret(secrets.admin_password, `admin_password`),
			username: requireString(config.admin_username, `admin_username`),
		})

		logger.info(`Publishing frontend and API routes through public_web.`)
		await capabilities.public_web.publishStaticSite({
			clientConfig: {
				AUTHENTIK_AUTH_URL: requireString(
					config.authentik_auth_url,
					`authentik_auth_url`,
				),
				AUTHENTIK_CLIENT_ID: oidcClient.client_id,
				AUTHENTIK_PROVIDER_SLUG: oidcClient.application_slug,
				MOVIEW_API_ORIGIN: baseUrl,
			},
			hostname,
			path: `/`,
			sourceDir: frontendDist,
		})
		await capabilities.public_web.registerReverseProxy({
			hostname,
			path: `/api`,
			targetHost: system.ipv4_address,
			targetPort: servicePort,
			websocket: false,
		})

		logger.success(`Moview registered at ${baseUrl}.`)
		return {
			authentik_client_id: oidcClient.client_id,
			authentik_client_secret: oidcClient.client_secret,
			first_admin_password: secrets.admin_password,
			first_admin_username: config.admin_username,
			smoke_test_password: secrets.smoke_test_password,
			smoke_test_username: config.smoke_test_username,
		}
	},
})

function requireString(value: unknown, name: string): string {
	if (typeof value !== `string` || value.length === 0) {
		throw new Error(`Missing required config value: ${name}`)
	}
	return value
}

function requireSecret(value: unknown, name: string): string {
	if (typeof value !== `string` || value.length === 0) {
		throw new Error(`Missing required secret: ${name}`)
	}
	return value
}

function requirePort(value: unknown, name: string): number {
	const port = typeof value === `number` ? value : Number(value)
	if (!Number.isInteger(port) || port < 1 || port > 65_535) {
		throw new Error(`Config value ${name} must be a TCP port.`)
	}
	return port
}
