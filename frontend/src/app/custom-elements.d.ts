import type { JSX } from "preact"

declare module "preact" {
	namespace JSX {
		interface IntrinsicElements {
			"movie-grid": JSX.HTMLAttributes<HTMLElement>
			"movie-poster": JSX.HTMLAttributes<HTMLElement>
			"moview-app": JSX.HTMLAttributes<HTMLElement>
		}
	}
}
