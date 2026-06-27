import { useI, useO } from "atom.io/react"
import type { VNode } from "preact"
import { useEffect } from "preact/hooks"

import { apiBase } from "./api"
import { AppChrome } from "./AppChrome"
import css from "./AppShell.module.css"
import { RoutePage } from "./RoutePage"
import {
	navigate,
	pageTitleSelector,
	type Pathname,
	pathnameAtom,
	routeGroupIdSelector,
	routeSelector,
} from "./routes"
import {
	type MoviewSnapshot,
	snapshotAtom,
} from "./state"

export function AppShell(): VNode {
	const snapshot = useO(snapshotAtom)
	const setSnapshot = useI(snapshotAtom)
	const route = useO(routeSelector)
	const pathname = useO(pathnameAtom)
	const groupId = useO(routeGroupIdSelector)
	const pageTitle = useO(pageTitleSelector)

	useEffect(() => {
		void fetch(`${apiBase}/api/bootstrap`)
			.then((response) => response.ok ? response.json() : null)
			.then((data: MoviewSnapshot | null) => {
				if (data?.selectedGroupId) {
					setSnapshot(data)
				}
			})
			.catch(() => {})
	}, [setSnapshot])

	useEffect(() => {
		if (pathname === `/` && snapshot.groups[0]) {
			navigate(`/groups/${snapshot.groups[0].id}` as Pathname)
		}
	}, [pathname, snapshot.groups])

	const selectedGroup = snapshot.groups.find((group) => group.id === groupId) ?? snapshot.groups[0]

	return (
		<app-shell className={css.class}>
			<header>
				<AppChrome />
			</header>
			<main>
				<page-heading>
					<h1>{pageTitle}</h1>
					{selectedGroup ? <span>{selectedGroup.name}</span> : null}
				</page-heading>
				<RoutePage route={route} />
			</main>
		</app-shell>
	)
}
