import { atom, getState, type Loadable, setState } from "atom.io"

import { fetchAppState } from "../api/client"
import type { AppState } from "../api/types"

export const selectedUserIdAtom = atom<string>({
	key: `selectedUserId`,
	default: `user-jeremy`,
})

export const selectedGroupIdAtom = atom<string | null>({
	key: `selectedGroupId`,
	default: null,
})

export const appStateAtom = atom<Loadable<AppState>, Error>({
	key: `appState`,
	default: async () =>
		fetchAppState({
			groupId: null,
			userId: `user-jeremy`,
		}),
	catch: [Error],
})

export const addMovieTitleAtom = atom<string>({
	key: `addMovieTitle`,
	default: ``,
})

export const groupNameDraftAtom = atom<string>({
	key: `groupNameDraft`,
	default: ``,
})

export const inviteUserIdAtom = atom<string>({
	key: `inviteUserId`,
	default: `user-bug`,
})

export const reviewGoodnessAtom = atom<number>({
	key: `reviewGoodness`,
	default: 3,
})

export const reviewRatingAtom = atom<number>({
	key: `reviewRating`,
	default: 8,
})

export const reviewFeelingsAtom = atom<string>({
	key: `reviewFeelings`,
	default: ``,
})

export const historySortAtom = atom<`date_watched` | `goodness` | `rating`>({
	key: `historySort`,
	default: `date_watched`,
})

export function replaceAppState(nextState: AppState): void {
	setState(appStateAtom, nextState)
	setState(selectedGroupIdAtom, nextState.activeGroup.id)
	setState(selectedUserIdAtom, nextState.currentUser.id)
}

export async function refreshAppState(): Promise<void> {
	const nextState = await fetchAppState({
		groupId: getState(selectedGroupIdAtom),
		userId: getState(selectedUserIdAtom),
	})
	replaceAppState(nextState)
}
