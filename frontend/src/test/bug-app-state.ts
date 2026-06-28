import type { AppState, Group, Movie, User } from "../api/types"

export type MintedAuthentikUser = {
	accessJwt: string
	groups: string[]
	user: User
}

const createdAt = `2026-06-26 18:00:00`

export const bugUser: User = {
	authentikSubject: `authentik|bug`,
	createdAt,
	displayName: `Bug`,
	faceTag: `bug`,
	id: `user-bug`,
}

const moiraUser: User = {
	authentikSubject: `authentik|moira`,
	createdAt,
	displayName: `Moira`,
	faceTag: `moira`,
	id: `user-moira`,
}

const jeremyUser: User = {
	authentikSubject: `authentik|jeremy`,
	createdAt,
	displayName: `Jeremy`,
	faceTag: `jeremy`,
	id: `user-jeremy`,
}

const peterUser: User = {
	authentikSubject: `authentik|peter`,
	createdAt,
	displayName: `Peter`,
	faceTag: `peter`,
	id: `user-peter`,
}

const group: Group = {
	authentikGroupSlug: `moview-moira-bug`,
	createdAt,
	createdByUserId: moiraUser.id,
	id: `group-moira-bug`,
	name: `Moira and Bug`,
}

const bmnGroup: Group = {
	authentikGroupSlug: `moview-bmn`,
	createdAt,
	createdByUserId: jeremyUser.id,
	id: `group-bmn`,
	name: `BMN`,
}

const policeStory: Movie = {
	createdAt,
	description: `A propulsive action comedy that Bug keeps asking Moira to add to a separate group.`,
	id: `movie-police-story`,
	imageUrl: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 420 620'%3E%3Crect width='420' height='620' fill='%23151716'/%3E%3Ctext x='40' y='330' fill='white' font-size='44'%3EPolice Story%3C/text%3E%3C/svg%3E`,
	metadataSource: `wikidata`,
	metadataUrl: `https://www.wikidata.org/wiki/Q724806`,
	releasedYear: 1985,
	runtimeMinutes: 101,
	title: `Police Story`,
}

export function mintBugUserInAuthentik(): MintedAuthentikUser {
	return {
		accessJwt: `header.${btoa(
			JSON.stringify({
				groups: [group.authentikGroupSlug],
				iss: `https://authentik.moview.test/application/o/moview/`,
				sub: bugUser.authentikSubject,
			}),
		)}.signature`,
		groups: [group.authentikGroupSlug],
		user: bugUser,
	}
}

export function createBugAppState(): AppState {
	return {
		activeGroup: group,
		currentUser: bugUser,
		groups: [bmnGroup, group],
		history: [
			{
				averageGoodnessOfPick: 4,
				averageRating: 8,
				chosenByUserId: moiraUser.id,
				createdAt,
				dateWatched: `2026-06-20`,
				goodnessOfPick: [
					{
						user: moiraUser,
						value: 4,
					},
				],
				groupId: group.id,
				id: `screening-police-story`,
				individualRatings: [
					{
						feelings: `Stunts first, questions later.`,
						user: bugUser,
						value: 8,
					},
				],
				movie: policeStory,
				movieId: policeStory.id,
				ready: [
					{
						ready: true,
						user: bugUser,
					},
					{
						ready: false,
						user: moiraUser,
					},
				],
			},
		],
		members: [
			{
				createdAt,
				groupId: group.id,
				id: `member-group-moira-bug-user-bug`,
				inviteStatus: `joined`,
				role: `member`,
				user: bugUser,
				userId: bugUser.id,
			},
			{
				createdAt,
				groupId: group.id,
				id: `member-group-moira-bug-user-moira`,
				inviteStatus: `joined`,
				role: `admin`,
				user: moiraUser,
				userId: moiraUser.id,
			},
		],
		personalPool: [
			{
				advocateNumber: 2,
				contributor: moiraUser,
				createdAt,
				groupId: group.id,
				id: `advocate-group-moira-bug-police-story-bug`,
				movie: policeStory,
				movieId: policeStory.id,
				rank: 1,
				userId: bugUser.id,
			},
		],
		pool: [
			{
				advocates: [
					{
						advocateNumber: 1,
						createdAt,
						groupId: group.id,
						id: `advocate-group-moira-bug-police-story-moira`,
						movieId: policeStory.id,
						rank: 1,
						user: moiraUser,
						userId: moiraUser.id,
					},
					{
						advocateNumber: 2,
						createdAt,
						groupId: group.id,
						id: `advocate-group-moira-bug-police-story-bug`,
						movieId: policeStory.id,
						rank: 1,
						user: bugUser,
						userId: bugUser.id,
					},
				],
				contributor: moiraUser,
				groupMovieId: `group-movie-moira-bug-police-story`,
				isQueued: true,
				movie: policeStory,
			},
		],
		queue: [
			{
				addedBy: bugUser,
				addedByUserId: bugUser.id,
				createdAt,
				groupId: group.id,
				id: `queue-moira-bug-police-story`,
				movie: policeStory,
				movieId: policeStory.id,
				position: 0,
				status: `on_deck`,
			},
		],
		turnOrder: [
			{
				createdAt,
				groupId: group.id,
				id: `turn-moira`,
				isCurrent: false,
				turnIndex: 0,
				user: moiraUser,
				userId: moiraUser.id,
			},
			{
				createdAt,
				groupId: group.id,
				id: `turn-bug`,
				isCurrent: true,
				turnIndex: 1,
				user: bugUser,
				userId: bugUser.id,
			},
		],
		users: [bugUser, jeremyUser, moiraUser, peterUser],
	}
}
