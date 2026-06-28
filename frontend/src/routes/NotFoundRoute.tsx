import type { VNode } from "preact"

import css from "./NotFoundRoute.module.css"

export function NotFoundRoute(): VNode {
	return (
		<not-found-route className={css.class}>
			<h1>Not Found</h1>
			<p>This route is not in the Moview tree.</p>
		</not-found-route>
	)
}
