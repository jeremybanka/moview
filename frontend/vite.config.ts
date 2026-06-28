import preact from "@preact/preset-vite"
import { defineConfig } from "vite"

const allowedHosts = [`moview`, `moview-1`]
const apiOrigin = process.env.MOVIEW_API_ORIGIN ?? `http://localhost:3001`

export default defineConfig({
	plugins: [preact()],
	preview: {
		allowedHosts,
		port: 4321,
		strictPort: true,
	},
	server: {
		allowedHosts,
		port: 4321,
		proxy: {
			"/api": apiOrigin,
		},
		strictPort: true,
	},
})
