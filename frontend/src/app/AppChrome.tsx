import { useI, useO } from "atom.io/react"
import type { VNode } from "preact"

import { AppAnchor } from "./AppAnchor"
import css from "./AppChrome.module.css"
import {
	currentNavItemSelector,
	navigate,
	type Pathname,
	routeGroupIdSelector,
} from "./routes"
import {
	selectedUserIdAtom,
	snapshotAtom,
} from "./state"

export function AppChrome(): VNode {
	const snapshot = useO(snapshotAtom)
	const selectedUserId = useO(selectedUserIdAtom)
	const setSelectedUserId = useI(selectedUserIdAtom)
	const groupId = useO(routeGroupIdSelector)
	const currentNavItem = useO(currentNavItemSelector)
	const selectedGroup = snapshot.groups.find((group) => group.id === groupId) ?? snapshot.groups[0]
	const selectedUser = snapshot.members.find((member) => member.id === selectedUserId) ?? snapshot.members[0]

	return (
		<app-chrome className={css.class}>
			<nav aria-label="Moview sections">
				<AppAnchor href={selectedGroup ? `/groups/${selectedGroup.id}` as Pathname : `/`}>
					<strong>Moview</strong>
				</AppAnchor>
				{selectedGroup ? (
					<app-nav>
						{([
							[`dashboard`, `Dashboard`, `/groups/${selectedGroup.id}`],
							[`pool`, `Pool`, `/groups/${selectedGroup.id}/pool`],
							[`personal`, `Personal`, `/groups/${selectedGroup.id}/personal`],
							[`queue`, `Queue`, `/groups/${selectedGroup.id}/queue`],
							[`turns`, `Turns`, `/groups/${selectedGroup.id}/turns`],
							[`history`, `History`, `/groups/${selectedGroup.id}/history`],
						] as const).map(([item, label, href]) => (
							<AppAnchor aria-current={currentNavItem === item ? `page` : undefined} href={href as Pathname} key={item}>
								{label}
							</AppAnchor>
						))}
					</app-nav>
				) : null}
			</nav>
			<form>
				<label>
					Group
					<select value={selectedGroup?.id ?? ``} onInput={(event) => navigate(`/groups/${event.currentTarget.value}` as Pathname)}>
						{snapshot.groups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}
					</select>
				</label>
				<label>
					Person
					<select value={selectedUser?.id ?? ``} onInput={(event) => setSelectedUserId(event.currentTarget.value)}>
						{snapshot.members.map((member) => <option key={member.id} value={member.id}>{member.displayName}</option>)}
					</select>
				</label>
			</form>
		</app-chrome>
	)
}
