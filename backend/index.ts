import { bootstrapSchema } from "./src/db/client"
import { seedDevData } from "./src/db/seed"
import { handleApi } from "./src/http/api"
import { assertRuntimeEnv, env } from "./src/env"

assertRuntimeEnv()
bootstrapSchema()
if (env.MOVIEW_MODE === `dev`) {
	await seedDevData()
}

const server = Bun.serve({
	fetch: handleApi,
	port: env.PORT,
})

console.log(`Moview API listening on http://localhost:${server.port}`)
