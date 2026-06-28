import { sql } from "drizzle-orm"
import {
	integer,
	real,
	sqliteTable,
	text,
	uniqueIndex,
} from "drizzle-orm/sqlite-core"

export const memberRoles = [`admin`, `member`] as const
export const inviteStatuses = [`joined`, `invited`] as const
export const queueStatuses = [`upcoming`, `on_deck`, `watched`] as const
export const metadataSources = [`seed`, `wikidata`, `open_movie_db`] as const

const createdAt = () =>
	text(`created_at`)
		.notNull()
		.default(sql`CURRENT_TIMESTAMP`)

export const users = sqliteTable(`users`, {
	id: text(`id`).primaryKey(),
	displayName: text(`display_name`).notNull(),
	faceTag: text(`face_tag`).notNull(),
	authentikSubject: text(`authentik_subject`).notNull().unique(),
	createdAt: createdAt(),
})

export const groups = sqliteTable(`groups`, {
	id: text(`id`).primaryKey(),
	name: text(`name`).notNull(),
	authentikGroupSlug: text(`authentik_group_slug`).notNull().unique(),
	createdByUserId: text(`created_by_user_id`)
		.notNull()
		.references(() => users.id),
	createdAt: createdAt(),
})

export const groupMembers = sqliteTable(
	`group_members`,
	{
		id: text(`id`).primaryKey(),
		groupId: text(`group_id`)
			.notNull()
			.references(() => groups.id, { onDelete: `cascade` }),
		userId: text(`user_id`)
			.notNull()
			.references(() => users.id, { onDelete: `cascade` }),
		role: text(`role`, { enum: memberRoles }).notNull(),
		inviteStatus: text(`invite_status`, { enum: inviteStatuses }).notNull(),
		createdAt: createdAt(),
	},
	(table) => [
		uniqueIndex(`group_members_group_user_unique`).on(
			table.groupId,
			table.userId,
		),
	],
)

export const movies = sqliteTable(
	`movies`,
	{
		id: text(`id`).primaryKey(),
		title: text(`title`).notNull(),
		description: text(`description`).notNull(),
		imageUrl: text(`image_url`).notNull(),
		releasedYear: integer(`released_year`),
		runtimeMinutes: integer(`runtime_minutes`),
		metadataSource: text(`metadata_source`, { enum: metadataSources })
			.notNull()
			.default(`seed`),
		metadataUrl: text(`metadata_url`).notNull(),
		createdAt: createdAt(),
	},
	(table) => [
		uniqueIndex(`movies_title_year_unique`).on(table.title, table.releasedYear),
	],
)

export const groupMovies = sqliteTable(
	`group_movies`,
	{
		id: text(`id`).primaryKey(),
		groupId: text(`group_id`)
			.notNull()
			.references(() => groups.id, { onDelete: `cascade` }),
		movieId: text(`movie_id`)
			.notNull()
			.references(() => movies.id, { onDelete: `cascade` }),
		contributorUserId: text(`contributor_user_id`)
			.notNull()
			.references(() => users.id),
		createdAt: createdAt(),
	},
	(table) => [
		uniqueIndex(`group_movies_group_movie_unique`).on(
			table.groupId,
			table.movieId,
		),
	],
)

export const advocates = sqliteTable(
	`advocates`,
	{
		id: text(`id`).primaryKey(),
		groupId: text(`group_id`)
			.notNull()
			.references(() => groups.id, { onDelete: `cascade` }),
		movieId: text(`movie_id`)
			.notNull()
			.references(() => movies.id, { onDelete: `cascade` }),
		userId: text(`user_id`)
			.notNull()
			.references(() => users.id, { onDelete: `cascade` }),
		advocateNumber: integer(`advocate_number`).notNull(),
		rank: real(`rank`).notNull(),
		createdAt: createdAt(),
	},
	(table) => [
		uniqueIndex(`advocates_group_movie_number_unique`).on(
			table.groupId,
			table.movieId,
			table.advocateNumber,
		),
		uniqueIndex(`advocates_group_movie_user_unique`).on(
			table.groupId,
			table.movieId,
			table.userId,
		),
		uniqueIndex(`advocates_group_user_rank_unique`).on(
			table.groupId,
			table.userId,
			table.rank,
		),
	],
)

export const queueEntries = sqliteTable(
	`queue_entries`,
	{
		id: text(`id`).primaryKey(),
		groupId: text(`group_id`)
			.notNull()
			.references(() => groups.id, { onDelete: `cascade` }),
		movieId: text(`movie_id`)
			.notNull()
			.references(() => movies.id, { onDelete: `cascade` }),
		addedByUserId: text(`added_by_user_id`)
			.notNull()
			.references(() => users.id),
		position: real(`position`).notNull(),
		status: text(`status`, { enum: queueStatuses })
			.notNull()
			.default(`upcoming`),
		createdAt: createdAt(),
	},
	(table) => [
		uniqueIndex(`queue_entries_group_position_unique`).on(
			table.groupId,
			table.position,
		),
	],
)

export const turnOrderEntries = sqliteTable(
	`turn_order_entries`,
	{
		id: text(`id`).primaryKey(),
		groupId: text(`group_id`)
			.notNull()
			.references(() => groups.id, { onDelete: `cascade` }),
		userId: text(`user_id`)
			.notNull()
			.references(() => users.id, { onDelete: `cascade` }),
		turnIndex: integer(`turn_index`).notNull(),
		isCurrent: integer(`is_current`, { mode: `boolean` })
			.notNull()
			.default(false),
		createdAt: createdAt(),
	},
	(table) => [
		uniqueIndex(`turn_order_entries_group_user_unique`).on(
			table.groupId,
			table.userId,
		),
		uniqueIndex(`turn_order_entries_group_index_unique`).on(
			table.groupId,
			table.turnIndex,
		),
	],
)

export const screenings = sqliteTable(`screenings`, {
	id: text(`id`).primaryKey(),
	groupId: text(`group_id`)
		.notNull()
		.references(() => groups.id, { onDelete: `cascade` }),
	movieId: text(`movie_id`)
		.notNull()
		.references(() => movies.id, { onDelete: `cascade` }),
	chosenByUserId: text(`chosen_by_user_id`)
		.notNull()
		.references(() => users.id),
	dateWatched: text(`date_watched`).notNull(),
	createdAt: createdAt(),
})

export const movieGroupReviews = sqliteTable(
	`movie_group_reviews`,
	{
		id: text(`id`).primaryKey(),
		groupId: text(`group_id`)
			.notNull()
			.references(() => groups.id, { onDelete: `cascade` }),
		movieId: text(`movie_id`)
			.notNull()
			.references(() => movies.id, { onDelete: `cascade` }),
		userId: text(`user_id`)
			.notNull()
			.references(() => users.id, { onDelete: `cascade` }),
		goodnessOfPick: integer(`goodness_of_pick`).notNull(),
		createdAt: createdAt(),
	},
	(table) => [
		uniqueIndex(`movie_group_reviews_group_movie_user_unique`).on(
			table.groupId,
			table.movieId,
			table.userId,
		),
	],
)

export const movieIndividualReviews = sqliteTable(
	`movie_individual_reviews`,
	{
		id: text(`id`).primaryKey(),
		movieId: text(`movie_id`)
			.notNull()
			.references(() => movies.id, { onDelete: `cascade` }),
		userId: text(`user_id`)
			.notNull()
			.references(() => users.id, { onDelete: `cascade` }),
		rating: integer(`rating`).notNull(),
		feelings: text(`feelings`),
		createdAt: createdAt(),
	},
	(table) => [
		uniqueIndex(`movie_individual_reviews_movie_user_unique`).on(
			table.movieId,
			table.userId,
		),
	],
)

export const reviewReadyStatuses = sqliteTable(
	`review_ready_statuses`,
	{
		id: text(`id`).primaryKey(),
		groupId: text(`group_id`)
			.notNull()
			.references(() => groups.id, { onDelete: `cascade` }),
		movieId: text(`movie_id`)
			.notNull()
			.references(() => movies.id, { onDelete: `cascade` }),
		userId: text(`user_id`)
			.notNull()
			.references(() => users.id, { onDelete: `cascade` }),
		ready: integer(`ready`, { mode: `boolean` }).notNull().default(false),
		createdAt: createdAt(),
	},
	(table) => [
		uniqueIndex(`review_ready_statuses_group_movie_user_unique`).on(
			table.groupId,
			table.movieId,
			table.userId,
		),
	],
)

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Group = typeof groups.$inferSelect
export type NewGroup = typeof groups.$inferInsert
export type GroupMember = typeof groupMembers.$inferSelect
export type NewGroupMember = typeof groupMembers.$inferInsert
export type Movie = typeof movies.$inferSelect
export type NewMovie = typeof movies.$inferInsert
export type GroupMovie = typeof groupMovies.$inferSelect
export type NewGroupMovie = typeof groupMovies.$inferInsert
export type Advocate = typeof advocates.$inferSelect
export type NewAdvocate = typeof advocates.$inferInsert
export type QueueEntry = typeof queueEntries.$inferSelect
export type NewQueueEntry = typeof queueEntries.$inferInsert
export type TurnOrderEntry = typeof turnOrderEntries.$inferSelect
export type NewTurnOrderEntry = typeof turnOrderEntries.$inferInsert
export type Screening = typeof screenings.$inferSelect
export type NewScreening = typeof screenings.$inferInsert
export type MovieGroupReview = typeof movieGroupReviews.$inferSelect
export type NewMovieGroupReview = typeof movieGroupReviews.$inferInsert
export type MovieIndividualReview = typeof movieIndividualReviews.$inferSelect
export type NewMovieIndividualReview = typeof movieIndividualReviews.$inferInsert
export type ReviewReadyStatus = typeof reviewReadyStatuses.$inferSelect
export type NewReviewReadyStatus = typeof reviewReadyStatuses.$inferInsert
