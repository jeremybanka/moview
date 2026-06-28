import { Database } from "bun:sqlite"
import { drizzle } from "drizzle-orm/bun-sqlite"

import { env } from "../env"
import * as schema from "./schema"

const databasePath = normalizeDatabaseUrl(env.DATABASE_URL)

export const sqlite = new Database(databasePath, {
	create: true,
	readwrite: true,
})
export const db = drizzle(sqlite, { schema })

export function bootstrapSchema(): void {
	sqlite.exec(`
		PRAGMA foreign_keys = ON;

		CREATE TABLE IF NOT EXISTS users (
			id TEXT PRIMARY KEY NOT NULL,
			display_name TEXT NOT NULL,
			face_tag TEXT NOT NULL,
			authentik_subject TEXT NOT NULL UNIQUE,
			created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
		);

		CREATE TABLE IF NOT EXISTS groups (
			id TEXT PRIMARY KEY NOT NULL,
			name TEXT NOT NULL,
			authentik_group_slug TEXT NOT NULL UNIQUE,
			created_by_user_id TEXT NOT NULL REFERENCES users(id),
			created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
		);

		CREATE TABLE IF NOT EXISTS group_members (
			id TEXT PRIMARY KEY NOT NULL,
			group_id TEXT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
			user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			role TEXT NOT NULL,
			invite_status TEXT NOT NULL,
			created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
		);
		CREATE UNIQUE INDEX IF NOT EXISTS group_members_group_user_unique
			ON group_members(group_id, user_id);

		CREATE TABLE IF NOT EXISTS movies (
			id TEXT PRIMARY KEY NOT NULL,
			title TEXT NOT NULL,
			description TEXT NOT NULL,
			image_url TEXT NOT NULL,
			released_year INTEGER,
			runtime_minutes INTEGER,
			metadata_source TEXT NOT NULL DEFAULT 'seed',
			metadata_url TEXT NOT NULL,
			created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
		);
		CREATE UNIQUE INDEX IF NOT EXISTS movies_title_year_unique
			ON movies(title, released_year);

		CREATE TABLE IF NOT EXISTS group_movies (
			id TEXT PRIMARY KEY NOT NULL,
			group_id TEXT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
			movie_id TEXT NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
			contributor_user_id TEXT NOT NULL REFERENCES users(id),
			created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
		);
		CREATE UNIQUE INDEX IF NOT EXISTS group_movies_group_movie_unique
			ON group_movies(group_id, movie_id);

		CREATE TABLE IF NOT EXISTS advocates (
			id TEXT PRIMARY KEY NOT NULL,
			group_id TEXT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
			movie_id TEXT NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
			user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			advocate_number INTEGER NOT NULL,
			rank REAL NOT NULL,
			created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
		);
		CREATE UNIQUE INDEX IF NOT EXISTS advocates_group_movie_number_unique
			ON advocates(group_id, movie_id, advocate_number);
		CREATE UNIQUE INDEX IF NOT EXISTS advocates_group_movie_user_unique
			ON advocates(group_id, movie_id, user_id);
		CREATE UNIQUE INDEX IF NOT EXISTS advocates_group_user_rank_unique
			ON advocates(group_id, user_id, rank);

		CREATE TABLE IF NOT EXISTS queue_entries (
			id TEXT PRIMARY KEY NOT NULL,
			group_id TEXT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
			movie_id TEXT NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
			added_by_user_id TEXT NOT NULL REFERENCES users(id),
			position REAL NOT NULL,
			status TEXT NOT NULL DEFAULT 'upcoming',
			created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
		);
		CREATE UNIQUE INDEX IF NOT EXISTS queue_entries_group_position_unique
			ON queue_entries(group_id, position);

		CREATE TABLE IF NOT EXISTS turn_order_entries (
			id TEXT PRIMARY KEY NOT NULL,
			group_id TEXT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
			user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			turn_index INTEGER NOT NULL,
			is_current INTEGER NOT NULL DEFAULT 0,
			created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
		);
		CREATE UNIQUE INDEX IF NOT EXISTS turn_order_entries_group_user_unique
			ON turn_order_entries(group_id, user_id);
		CREATE UNIQUE INDEX IF NOT EXISTS turn_order_entries_group_index_unique
			ON turn_order_entries(group_id, turn_index);

		CREATE TABLE IF NOT EXISTS screenings (
			id TEXT PRIMARY KEY NOT NULL,
			group_id TEXT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
			movie_id TEXT NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
			chosen_by_user_id TEXT NOT NULL REFERENCES users(id),
			date_watched TEXT NOT NULL,
			created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
		);

		CREATE TABLE IF NOT EXISTS movie_group_reviews (
			id TEXT PRIMARY KEY NOT NULL,
			group_id TEXT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
			movie_id TEXT NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
			user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			goodness_of_pick INTEGER NOT NULL,
			created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
		);
		CREATE UNIQUE INDEX IF NOT EXISTS movie_group_reviews_group_movie_user_unique
			ON movie_group_reviews(group_id, movie_id, user_id);

		CREATE TABLE IF NOT EXISTS movie_individual_reviews (
			id TEXT PRIMARY KEY NOT NULL,
			movie_id TEXT NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
			user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			rating INTEGER NOT NULL,
			feelings TEXT,
			created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
		);
		CREATE UNIQUE INDEX IF NOT EXISTS movie_individual_reviews_movie_user_unique
			ON movie_individual_reviews(movie_id, user_id);

		CREATE TABLE IF NOT EXISTS review_ready_statuses (
			id TEXT PRIMARY KEY NOT NULL,
			group_id TEXT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
			movie_id TEXT NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
			user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			ready INTEGER NOT NULL DEFAULT 0,
			created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
		);
		CREATE UNIQUE INDEX IF NOT EXISTS review_ready_statuses_group_movie_user_unique
			ON review_ready_statuses(group_id, movie_id, user_id);
	`)
}

export function resetDatabase(): void {
	sqlite.exec(`
		PRAGMA foreign_keys = OFF;
		DELETE FROM review_ready_statuses;
		DELETE FROM movie_individual_reviews;
		DELETE FROM movie_group_reviews;
		DELETE FROM screenings;
		DELETE FROM turn_order_entries;
		DELETE FROM queue_entries;
		DELETE FROM advocates;
		DELETE FROM group_movies;
		DELETE FROM group_members;
		DELETE FROM movies;
		DELETE FROM groups;
		DELETE FROM users;
		PRAGMA foreign_keys = ON;
	`)
}

function normalizeDatabaseUrl(databaseUrl: string): string {
	if (databaseUrl === `:memory:`) {
		return databaseUrl
	}
	if (databaseUrl.startsWith(`file:`)) {
		const path = databaseUrl.slice(`file:`.length)
		return path.length > 0 ? path : `moview.dev.sqlite`
	}
	return databaseUrl
}
