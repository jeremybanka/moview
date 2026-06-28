import { useI, useO } from "atom.io/react"
import type { JSX, VNode } from "preact"

import { createGroup, inviteUser } from "../api/client"
import type { AppState } from "../api/types"
import {
	groupNameDraftAtom,
	inviteUserIdAtom,
	replaceAppState,
} from "../state/app-state"
import css from "./GroupsRoute.module.css"

export function GroupsRoute(props: { state: AppState }): VNode {
	const groupName = useO(groupNameDraftAtom)
	const inviteUserId = useO(inviteUserIdAtom)
	const setGroupName = useI(groupNameDraftAtom)
	const setInviteUserId = useI(inviteUserIdAtom)

	function submitGroup(event: JSX.TargetedSubmitEvent<HTMLFormElement>): void {
		event.preventDefault()
		if (!groupName.trim()) {
			return
		}
		void createGroup({
			creatorUserId: props.state.currentUser.id,
			name: groupName.trim(),
		}).then((nextState) => {
			replaceAppState(nextState)
			setGroupName(``)
		})
	}

	function submitInvite(event: JSX.TargetedSubmitEvent<HTMLFormElement>): void {
		event.preventDefault()
		void inviteUser({
			groupId: props.state.activeGroup.id,
			userId: inviteUserId,
		}).then(replaceAppState)
	}

	return (
		<groups-route className={css.class}>
			<section>
				<h1>Groups</h1>
				<p>{props.state.activeGroup.authentikGroupSlug}</p>
			</section>
			<group-actions>
				<form onSubmit={submitGroup}>
					<label>
						<span>New group</span>
						<input
							onInput={(event: JSX.TargetedInputEvent<HTMLInputElement>) => {
								setGroupName(event.currentTarget.value)
							}}
							placeholder="Sunday weirds"
							type="text"
							value={groupName}
						/>
					</label>
					<button disabled={!groupName.trim()} type="submit">
						Create
					</button>
				</form>
				<form onSubmit={submitInvite}>
					<label>
						<span>Invite</span>
						<select
							onInput={(event: JSX.TargetedInputEvent<HTMLSelectElement>) => {
								setInviteUserId(event.currentTarget.value)
							}}
							value={inviteUserId}
						>
							{props.state.users.map((user) => (
								<option key={user.id} value={user.id}>
									{user.displayName}
								</option>
							))}
						</select>
					</label>
					<button type="submit">Invite</button>
				</form>
			</group-actions>
			<member-list>
				{props.state.members.map((member) => (
					<article key={member.id}>
						<strong>{member.user.displayName}</strong>
						<span>{member.role}</span>
						<span>{member.inviteStatus}</span>
					</article>
				))}
			</member-list>
		</groups-route>
	)
}
