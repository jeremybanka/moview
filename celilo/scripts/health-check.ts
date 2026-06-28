import { defineHook } from "@celilo/capabilities"

type MoviewConfig = {
	public_hostname: string
	service_port: number
}

type RequiredCapabilities = readonly [`public_web`]

export default defineHook<
	MoviewConfig,
	RequiredCapabilities,
	[],
	`health_check`
>({
	hook: `health_check`,
	requires: [`public_web`] as const,
	handler: async ({ config, logger, systems }) => {
		const system = systems[0]
		const hostname = requireString(config.public_hostname, `public_hostname`)
		const port = requirePort(config.service_port, `service_port`)
		const checks = []

		if (!system) {
			checks.push({
				message: `No app-zone system is recorded for Moview.`,
				name: `app system`,
				status: `fail` as const,
			})
		} else {
			const apiUrl = `http://${system.ipv4_address}:${port}/api/health`
			logger.info(`Checking backend health at ${apiUrl}.`)
			checks.push(await checkHttp(`backend`, apiUrl))
		}

		const publicUrl = `https://${hostname}/`
		logger.info(`Checking public route at ${publicUrl}.`)
		checks.push(await checkHttp(`public route`, publicUrl))

		return {
			checks,
			status: checks.some((check) => check.status === `fail`)
				? `unhealthy`
				: `healthy`,
		}
	},
})

async function checkHttp(name: string, url: string) {
	try {
		const response = await fetch(url)
		if (response.ok) {
			return {
				message: `${response.status} ${response.statusText}`,
				name,
				status: `pass` as const,
			}
		}
		return {
			message: `${response.status} ${response.statusText}`,
			name,
			status: `fail` as const,
		}
	} catch (error) {
		return {
			message: error instanceof Error ? error.message : String(error),
			name,
			status: `fail` as const,
		}
	}
}

function requireString(value: unknown, name: string): string {
	if (typeof value !== `string` || value.length === 0) {
		throw new Error(`Missing required config value: ${name}`)
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
