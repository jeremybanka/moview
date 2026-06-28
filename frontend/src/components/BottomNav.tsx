import { useO } from "atom.io/react"
import type { VNode } from "preact"

import { type Pathname, routeSelector } from "../state/routes"
import { AppAnchor } from "./AppAnchor"
import css from "./BottomNav.module.css"

const navItems: Array<{ href: Pathname; label: string; segment: string }> = [
	{ href: `/pool`, label: `Pool`, segment: `pool` },
	{ href: `/queue`, label: `Queue`, segment: `queue` },
	{ href: `/personal`, label: `Mine`, segment: `personal` },
	{ href: `/reviews`, label: `Reviews`, segment: `reviews` },
	{ href: `/history`, label: `History`, segment: `history` },
	{ href: `/groups`, label: `Groups`, segment: `groups` },
]

export function BottomNav(): VNode {
	const route = useO(routeSelector)
	const activeSegment = route === 404 ? null : (route[0] ?? `pool`)

	return (
		<bottom-nav className={css.class}>
			{navItems.map((item) => (
				<AppAnchor
					current={activeSegment === item.segment}
					href={item.href}
					key={item.href}
				>
					{item.label}
				</AppAnchor>
			))}
		</bottom-nav>
	)
}
