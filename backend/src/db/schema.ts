import { relations, sql } from "drizzle-orm"
import {
	index,
	integer,
	real,
	sqliteTable,
	text,
	unique,
} from "drizzle-orm/sqlite-core"
import { z } from "zod"

export const users = sqliteTable(`users`, {
	id: text(`id`).primaryKey(),
	displayName: text(`display_name`).notNull(),
	email: text(`email`).notNull().unique(),
	authentikSubject: text(`authentik_subject`).unique(),
	avatarColor: text(`avatar_color`).notNull(),
	createdAt: text(`created_at`)
		.notNull()
		.default(sql`CURRENT_TIMESTAMP`),
})

export const groups = sqliteTable(`groups`, {
	id: text(`id`).primaryKey(),
	name: text(`name`).notNull(),
	authentikGroup: text(`authentik_group`).notNull().unique(),
	createdByUserId: text(`created_by_user_id`)
		.notNull()
		.references(() => users.id),
	createdAt: text(`created_at`)
		.notNull()
		.default(sql`CURRENT_TIMESTAMP`),
})

export const memberships = sqliteTable(
	`memberships`,
	{
		id: text(`id`).primaryKey(),
		groupId: text(`group_id`)
			.notNull()
			.references(() => groups.id),
		userId: text(`user_id`)
			.notNull()
			.references(() => users.id),
		role: text(`role`, { enum: [`admin`, `member`] })
			.notNull()
			.default(`member`),
		createdAt: text(`created_at`)
			.notNull()
			.default(sql`CURRENT_TIMESTAMP`),
	},
	(table) => ({
		groupUser: unique(`memberships_group_user_unique`).on(
			table.groupId,
			table.userId,
		),
	}),
)

export const invites = sqliteTable(`invites`, {
	id: text(`id`).primaryKey(),
	groupId: text(`group_id`)
		.notNull()
		.references(() => groups.id),
	email: text(`email`).notNull(),
	token: text(`token`).notNull().unique(),
	status: text(`status`, { enum: [`pending`, `accepted`, `revoked`] })
		.notNull()
		.default(`pending`),
	createdByUserId: text(`created_by_user_id`)
		.notNull()
		.references(() => users.id),
	createdAt: text(`created_at`)
		.notNull()
		.default(sql`CURRENT_TIMESTAMP`),
	acceptedAt: text(`accepted_at`),
})

export const movies = sqliteTable(
	`movies`,
	{
		id: text(`id`).primaryKey(),
		title: text(`title`).notNull(),
		year: integer(`year`),
		description: text(`description`),
		posterPath: text(`poster_path`),
		metadataSource: text(`metadata_source`, { enum: [`tmdb`, `manual`] })
			.notNull()
			.default(`manual`),
		sourceId: text(`source_id`),
		createdAt: text(`created_at`)
			.notNull()
			.default(sql`CURRENT_TIMESTAMP`),
	},
	(table) => ({
		source: unique(`movies_source_unique`).on(
			table.metadataSource,
			table.sourceId,
		),
	}),
)

export const advocates = sqliteTable(
	`advocates`,
	{
		id: text(`id`).primaryKey(),
		groupId: text(`group_id`)
			.notNull()
			.references(() => groups.id),
		movieId: text(`movie_id`)
			.notNull()
			.references(() => movies.id),
		userId: text(`user_id`)
			.notNull()
			.references(() => users.id),
		advocateNumber: integer(`advocate_number`).notNull(),
		rank: real(`rank`).notNull(),
		createdAt: text(`created_at`)
			.notNull()
			.default(sql`CURRENT_TIMESTAMP`),
	},
	(table) => ({
		groupMovieAdvocate: unique(`advocates_group_movie_number_unique`).on(
			table.groupId,
			table.movieId,
			table.advocateNumber,
		),
		groupUserMovie: unique(`advocates_group_user_movie_unique`).on(
			table.groupId,
			table.userId,
			table.movieId,
		),
		groupUserRank: unique(`advocates_group_user_rank_unique`).on(
			table.groupId,
			table.userId,
			table.rank,
		),
		personalRank: index(`advocates_personal_rank_idx`).on(
			table.groupId,
			table.userId,
			table.rank,
		),
	}),
)

export const queueEntries = sqliteTable(
	`queue_entries`,
	{
		id: text(`id`).primaryKey(),
		groupId: text(`group_id`)
			.notNull()
			.references(() => groups.id),
		movieId: text(`movie_id`)
			.notNull()
			.references(() => movies.id),
		addedByUserId: text(`added_by_user_id`)
			.notNull()
			.references(() => users.id),
		position: real(`position`).notNull(),
		status: text(`status`, { enum: [`queued`, `watched`, `returned`] })
			.notNull()
			.default(`queued`),
		createdAt: text(`created_at`)
			.notNull()
			.default(sql`CURRENT_TIMESTAMP`),
	},
	(table) => ({
		groupPosition: unique(`queue_entries_group_position_unique`).on(
			table.groupId,
			table.position,
		),
		activeMovie: unique(`queue_entries_group_movie_status_unique`).on(
			table.groupId,
			table.movieId,
			table.status,
		),
	}),
)

export const turnOrderEntries = sqliteTable(
	`turn_order_entries`,
	{
		id: text(`id`).primaryKey(),
		groupId: text(`group_id`)
			.notNull()
			.references(() => groups.id),
		userId: text(`user_id`)
			.notNull()
			.references(() => users.id),
		position: integer(`position`).notNull(),
	},
	(table) => ({
		groupPosition: unique(`turn_order_group_position_unique`).on(
			table.groupId,
			table.position,
		),
		groupUser: unique(`turn_order_group_user_unique`).on(
			table.groupId,
			table.userId,
		),
	}),
)

export const movieNights = sqliteTable(`movie_nights`, {
	id: text(`id`).primaryKey(),
	groupId: text(`group_id`)
		.notNull()
		.references(() => groups.id),
	movieId: text(`movie_id`)
		.notNull()
		.references(() => movies.id),
	queueEntryId: text(`queue_entry_id`).references(() => queueEntries.id),
	chosenByUserId: text(`chosen_by_user_id`).references(() => users.id),
	dateWatched: text(`date_watched`).notNull(),
	createdAt: text(`created_at`)
		.notNull()
		.default(sql`CURRENT_TIMESTAMP`),
})

export const groupReviews = sqliteTable(
	`group_reviews`,
	{
		id: text(`id`).primaryKey(),
		groupId: text(`group_id`)
			.notNull()
			.references(() => groups.id),
		movieId: text(`movie_id`)
			.notNull()
			.references(() => movies.id),
		movieNightId: text(`movie_night_id`)
			.notNull()
			.references(() => movieNights.id),
		userId: text(`user_id`)
			.notNull()
			.references(() => users.id),
		goodnessOfPick: integer(`goodness_of_pick`).notNull(),
		createdAt: text(`created_at`)
			.notNull()
			.default(sql`CURRENT_TIMESTAMP`),
	},
	(table) => ({
		onePerNight: unique(`group_reviews_user_group_movie_night_unique`).on(
			table.userId,
			table.groupId,
			table.movieId,
			table.movieNightId,
		),
	}),
)

export const individualReviews = sqliteTable(
	`individual_reviews`,
	{
		id: text(`id`).primaryKey(),
		movieId: text(`movie_id`)
			.notNull()
			.references(() => movies.id),
		movieNightId: text(`movie_night_id`)
			.notNull()
			.references(() => movieNights.id),
		userId: text(`user_id`)
			.notNull()
			.references(() => users.id),
		rating: integer(`rating`).notNull(),
		feelings: text(`feelings`),
		createdAt: text(`created_at`)
			.notNull()
			.default(sql`CURRENT_TIMESTAMP`),
	},
	(table) => ({
		onePerNight: unique(`individual_reviews_user_movie_night_unique`).on(
			table.userId,
			table.movieId,
			table.movieNightId,
		),
	}),
)

export const userRelations = relations(users, ({ many }) => ({
	advocates: many(advocates),
	memberships: many(memberships),
}))

export const groupRelations = relations(groups, ({ many }) => ({
	advocates: many(advocates),
	memberships: many(memberships),
	queueEntries: many(queueEntries),
	turnOrderEntries: many(turnOrderEntries),
}))

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Group = typeof groups.$inferSelect
export type NewGroup = typeof groups.$inferInsert
export type Movie = typeof movies.$inferSelect
export type NewMovie = typeof movies.$inferInsert
export type Advocate = typeof advocates.$inferSelect
export type NewAdvocate = typeof advocates.$inferInsert
export type QueueEntry = typeof queueEntries.$inferSelect
export type NewQueueEntry = typeof queueEntries.$inferInsert

type TableWithInferInsert = {
	_: {
		inferInsert: Record<string, unknown>
	}
}

type ZodShape<T extends Record<string, unknown>> = {
	[K in keyof T]-?: z.ZodType<T[K]>
}

function deriveLooseInsertSchema<TTable extends TableWithInferInsert>(
	_table: TTable,
) {
	return z.object({}).passthrough() as z.ZodObject<
		ZodShape<TTable[`_`][`inferInsert`]>
	>
}

export const insertUserSchema = deriveLooseInsertSchema(users)
export const insertGroupSchema = deriveLooseInsertSchema(groups)
export const insertMovieSchema = deriveLooseInsertSchema(movies)
export const insertAdvocateSchema = deriveLooseInsertSchema(advocates)
export const insertQueueEntrySchema = deriveLooseInsertSchema(queueEntries)
