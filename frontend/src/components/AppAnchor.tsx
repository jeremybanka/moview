import type { ComponentChildren, VNode } from "preact"

import type { Pathname } from "../state/routes"
import css from "./AppAnchor.module.css"

type AppAnchorProps = {
	children: ComponentChildren
	current?: boolean
	href: Pathname
}

export function AppAnchor(props: AppAnchorProps): VNode {
	return (
		<app-anchor className={css.class}>
			<a aria-current={props.current ? `page` : undefined} href={props.href}>
				{props.children}
			</a>
		</app-anchor>
	)
}
