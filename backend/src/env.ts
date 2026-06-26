import { createEnv } from "@t3-oss/env-core"
import { z } from "zod"

const modeSchema = z.enum([`dev`, `authentik`]).default(`dev`)

export const env = createEnv({
	server: {
		APP_ORIGIN: z.string().url().default(`http://localhost:4321`),
		AUTHENTIK_GROUP_CLAIM: z.string().default(`groups`),
		DATABASE_URL: z.string().optional(),
		MOVIEW_DB_PATH: z.string().default(`./moview.sqlite`),
		MOVIEW_MODE: modeSchema,
		OIDC_AUDIENCE: z.string().optional(),
		OIDC_CLIENT_ID: z.string().optional(),
		OIDC_ISSUER: z.string().url().optional(),
		OIDC_JWKS_URI: z.string().url().optional(),
		OIDC_REDIRECT_URI: z.string().url().optional(),
		PORT: z.coerce.number().int().positive().default(3000),
		TMDB_API_KEY: z.string().optional(),
	},
	runtimeEnv: process.env,
})

const authentikRequired = [
	`OIDC_AUDIENCE`,
	`OIDC_CLIENT_ID`,
	`OIDC_ISSUER`,
	`OIDC_JWKS_URI`,
	`OIDC_REDIRECT_URI`,
] as const

export function assertRuntimeEnv(): void {
	if (env.MOVIEW_MODE !== `authentik`) {
		return
	}
	const missing = authentikRequired.filter((key) => !env[key])
	if (missing.length > 0) {
		throw new Error(`MOVIEW_MODE=authentik requires ${missing.join(`, `)}`)
	}
}

export function sqlitePath(): string {
	if (env.DATABASE_URL?.startsWith(`file:`)) {
		return env.DATABASE_URL.slice(`file:`.length)
	}
	return env.MOVIEW_DB_PATH
}
