import { defineConfig } from "drizzle-kit"

export default defineConfig({
	dialect: `sqlite`,
	out: `./backend/drizzle`,
	schema: `./backend/src/db/schema.ts`,
})
