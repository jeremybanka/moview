import type { JSX, VNode } from "preact"

import css from "./AppAnchor.module.css"
import type { Pathname } from "./routes"

type AppAnchorProps = Omit<JSX.AnchorHTMLAttributes<HTMLAnchorElement>, `className` | `href`> & {
	href: Pathname
}

export function AppAnchor(props: AppAnchorProps): VNode {
	return (
		<app-anchor className={css.class}>
			<a {...props} />
		</app-anchor>
	)
}
