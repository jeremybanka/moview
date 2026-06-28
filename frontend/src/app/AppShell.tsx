import { useLoadable, useO } from "atom.io/react"
import type { JSX, VNode } from "preact"

import { fetchAppState } from "../api/client"
import type { AppState } from "../api/types"
import { BottomNav } from "../components/BottomNav"
import { MetricStrip } from "../components/MetricStrip"
import { GroupsRoute } from "../routes/GroupsRoute"
import { HistoryRoute } from "../routes/HistoryRoute"
import { LoginRoute } from "../routes/LoginRoute"
import { NotFoundRoute } from "../routes/NotFoundRoute"
import { PersonalRoute } from "../routes/PersonalRoute"
import { PoolRoute } from "../routes/PoolRoute"
import { QueueRoute } from "../routes/QueueRoute"
import { ReviewsRoute } from "../routes/ReviewsRoute"
import {
	appStateAtom,
	replaceAppState,
	selectedGroupIdAtom,
	selectedUserIdAtom,
} from "../state/app-state"
import { type Route,routeSelector } from "../state/routes"
import css from "./AppShell.module.css"

export function AppShell(): VNode {
	const loadable = useLoadable(appStateAtom)
	const route = useO(routeSelector)
	const selectedGroupId = useO(selectedGroupIdAtom)
	const selectedUserId = useO(selectedUserIdAtom)

	if (loadable === `LOADING`) {
		return (
			<app-shell className={css.class}>
				<header>
					<strong>Moview</strong>
				</header>
				<main>
					<loading-state>Loading</loading-state>
				</main>
				<footer>
					<BottomNav />
				</footer>
			</app-shell>
		)
	}
	if (loadable.value instanceof Error) {
		if (route !== 404 && route[0] === `login`) {
			return (
				<app-shell className={css.class}>
					<header>
						<strong>Moview</strong>
					</header>
					<main>
						<LoginRoute />
					</main>
					<footer>
						<BottomNav />
					</footer>
				</app-shell>
			)
		}
		return (
			<app-shell className={css.class}>
				<header>
					<strong>Moview</strong>
				</header>
				<main>
					<loading-state>{loadable.value.message}</loading-state>
				</main>
				<footer>
					<BottomNav />
				</footer>
			</app-shell>
		)
	}

	const state = loadable.value

	function updateUser(event: JSX.TargetedInputEvent<HTMLSelectElement>): void {
		const userId = event.currentTarget.value
		void fetchAppState({
			groupId: selectedGroupId ?? state.activeGroup.id,
			userId,
		}).then(replaceAppState)
	}

	function updateGroup(event: JSX.TargetedInputEvent<HTMLSelectElement>): void {
		const groupId = event.currentTarget.value
		void fetchAppState({
			groupId,
			userId: selectedUserId,
		}).then(replaceAppState)
	}

	return (
		<app-shell className={css.class}>
			<header>
				<strong>Moview</strong>
				<app-controls>
					<label>
						<span>User</span>
						<select onInput={updateUser} value={state.currentUser.id}>
							{state.users.map((user) => (
								<option key={user.id} value={user.id}>
									{user.displayName}
								</option>
							))}
						</select>
					</label>
					<label>
						<span>Group</span>
						<select onInput={updateGroup} value={state.activeGroup.id}>
							{state.groups.map((group) => (
								<option key={group.id} value={group.id}>
									{group.name}
								</option>
							))}
						</select>
					</label>
				</app-controls>
			</header>
			<main>
				<MetricStrip state={state} />
				{renderRoute(route as Route | 404, state)}
			</main>
			<footer>
				<BottomNav />
			</footer>
		</app-shell>
	)
}

function renderRoute(route: Route | 404, state: AppState): VNode {
	if (route === 404) {
		return <NotFoundRoute />
	}
	switch (route[0] ?? `pool`) {
		case `groups`:
			return <GroupsRoute state={state} />
		case `history`:
			return <HistoryRoute state={state} />
		case `login`:
			return <LoginRoute state={state} />
		case `personal`:
			return <PersonalRoute state={state} />
		case `pool`:
			return <PoolRoute state={state} />
		case `queue`:
			return <QueueRoute state={state} />
		case `reviews`:
			return <ReviewsRoute state={state} />
		default:
			return <NotFoundRoute />
	}
}
