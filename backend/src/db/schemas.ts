import {
	createInsertSchema,
	createSelectSchema,
	createUpdateSchema,
} from "drizzle-zod"
import { z } from "zod"

import {
	advocates,
	groupMembers,
	groupMovies,
	groups,
	movieGroupReviews,
	movieIndividualReviews,
	movies,
	queueEntries,
	reviewReadyStatuses,
	screenings,
	turnOrderEntries,
	users,
} from "./schema"

export const userSchema = createSelectSchema(users)
export const insertUserSchema = createInsertSchema(users)
export const groupSchema = createSelectSchema(groups)
export const insertGroupSchema = createInsertSchema(groups)
export const groupMemberSchema = createSelectSchema(groupMembers)
export const insertGroupMemberSchema = createInsertSchema(groupMembers)
export const movieSchema = createSelectSchema(movies)
export const insertMovieSchema = createInsertSchema(movies)
export const updateMovieSchema = createUpdateSchema(movies)
export const groupMovieSchema = createSelectSchema(groupMovies)
export const insertGroupMovieSchema = createInsertSchema(groupMovies)
export const advocateSchema = createSelectSchema(advocates)
export const insertAdvocateSchema = createInsertSchema(advocates)
export const queueEntrySchema = createSelectSchema(queueEntries)
export const insertQueueEntrySchema = createInsertSchema(queueEntries)
export const turnOrderEntrySchema = createSelectSchema(turnOrderEntries)
export const insertTurnOrderEntrySchema = createInsertSchema(turnOrderEntries)
export const screeningSchema = createSelectSchema(screenings)
export const insertScreeningSchema = createInsertSchema(screenings)
export const movieGroupReviewSchema = createSelectSchema(movieGroupReviews)
export const insertMovieGroupReviewSchema = createInsertSchema(movieGroupReviews)
export const movieIndividualReviewSchema = createSelectSchema(
	movieIndividualReviews,
)
export const insertMovieIndividualReviewSchema = createInsertSchema(
	movieIndividualReviews,
)
export const reviewReadyStatusSchema = createSelectSchema(reviewReadyStatuses)
export const insertReviewReadyStatusSchema =
	createInsertSchema(reviewReadyStatuses)

export const addMovieRequestSchema = z.object({
	groupId: z.string().min(1),
	userId: z.string().min(1),
	title: z.string().trim().min(1),
	description: z.string().trim().min(1).optional(),
	imageUrl: z.string().url().optional(),
	releasedYear: z.number().int().min(1888).max(2100).optional(),
})

export const addQueueEntryRequestSchema = z.object({
	groupId: z.string().min(1),
	movieId: z.string().min(1),
	userId: z.string().min(1),
	placement: z.enum([`on_deck`, `second`, `end`]).default(`end`),
})

export const returnQueueEntryRequestSchema = z.object({
	queueEntryId: z.string().min(1),
})

export const updatePersonalRankRequestSchema = z.object({
	advocateId: z.string().min(1),
	beforeAdvocateId: z.string().min(1).optional(),
	afterAdvocateId: z.string().min(1).optional(),
})

export const createGroupRequestSchema = z.object({
	creatorUserId: z.string().min(1),
	name: z.string().trim().min(1),
})

export const inviteUserRequestSchema = z.object({
	groupId: z.string().min(1),
	userId: z.string().min(1),
})

export const reviewRequestSchema = z.object({
	groupId: z.string().min(1),
	movieId: z.string().min(1),
	userId: z.string().min(1),
	goodnessOfPick: z.number().int(),
	rating: z.number().int(),
	feelings: z.string().trim().optional(),
})
