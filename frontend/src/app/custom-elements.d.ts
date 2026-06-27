/* eslint-disable quotes */
import type { JSX } from "preact"

declare module "preact" {
	namespace JSX {
		interface IntrinsicElements {
			"app-nav": JSX.HTMLAttributes<HTMLElement>
			"app-shell": JSX.HTMLAttributes<HTMLElement>
			"movie-card-actions": JSX.HTMLAttributes<HTMLElement>
			"movie-card-heading": JSX.HTMLAttributes<HTMLElement>
			"movie-grid": JSX.HTMLAttributes<HTMLElement>
			"movie-poster": JSX.HTMLAttributes<HTMLElement>
			"page-heading": JSX.HTMLAttributes<HTMLElement>
			"route-actions": JSX.HTMLAttributes<HTMLElement>
			"stat-grid": JSX.HTMLAttributes<HTMLElement>
		}
	}
}
