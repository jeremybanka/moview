export type User = {
	authentikSubject: string
	createdAt: string
	displayName: string
	faceTag: string
	id: string
}

export type Group = {
	authentikGroupSlug: string
	createdAt: string
	createdByUserId: string
	id: string
	name: string
}

export type GroupMember = {
	createdAt: string
	groupId: string
	id: string
	inviteStatus: `invited` | `joined`
	role: `admin` | `member`
	user: User
	userId: string
}

export type Movie = {
	createdAt: string
	description: string
	id: string
	imageUrl: string
	metadataSource: `open_movie_db` | `seed` | `wikidata`
	metadataUrl: string
	releasedYear: number | null
	runtimeMinutes: number | null
	title: string
}

export type Advocate = {
	advocateNumber: number
	createdAt: string
	groupId: string
	id: string
	movieId: string
	rank: number
	userId: string
}

export type PoolMovie = {
	advocates: Array<Advocate & { user: User }>
	contributor: User
	groupMovieId: string
	isQueued: boolean
	movie: Movie
}

export type QueueMovie = {
	addedBy: User
	addedByUserId: string
	createdAt: string
	groupId: string
	id: string
	movie: Movie
	movieId: string
	position: number
	status: `on_deck` | `upcoming` | `watched`
}

export type TurnOrderEntry = {
	createdAt: string
	groupId: string
	id: string
	isCurrent: boolean
	turnIndex: number
	user: User
	userId: string
}

export type PersonalMovie = Advocate & {
	contributor: User
	movie: Movie
}

export type ReviewSummary = {
	averageGoodnessOfPick: number
	averageRating: number
	chosenByUserId: string
	createdAt: string
	dateWatched: string
	goodnessOfPick: Array<{
		user: User
		value: number
	}>
	groupId: string
	id: string
	individualRatings: Array<{
		feelings: string | null
		user: User
		value: number
	}>
	movie: Movie
	movieId: string
	ready: Array<{
		ready: boolean
		user: User
	}>
}

export type AppState = {
	activeGroup: Group
	currentUser: User
	groups: Group[]
	history: ReviewSummary[]
	members: GroupMember[]
	personalPool: PersonalMovie[]
	pool: PoolMovie[]
	queue: QueueMovie[]
	turnOrder: TurnOrderEntry[]
	users: User[]
}
