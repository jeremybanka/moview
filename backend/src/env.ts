import { createEnv } from "@t3-oss/env-core"
import { z } from "zod"

export const env = createEnv({
	server: {
		AUTHENTIK_ISSUER: z.string().url().optional(),
		DATABASE_URL: z.string().min(1).default(`file:./moview.dev.sqlite`),
		HOST: z.string().min(1).default(`127.0.0.1`),
		MOVIEW_MODE: z.enum([`dev`, `production`, `test`]).default(`dev`),
		PORT: z.coerce.number().int().min(1).max(65535).default(3001),
	},
	runtimeEnv: Bun.env,
	emptyStringAsUndefined: true,
})

export function assertRuntimeEnv(): void {
	if (env.MOVIEW_MODE !== `dev` && !env.AUTHENTIK_ISSUER) {
		throw new Error(`AUTHENTIK_ISSUER is required outside dev mode.`)
	}
}
