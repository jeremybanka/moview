import { Database } from "bun:sqlite"
import { drizzle } from "drizzle-orm/bun-sqlite"

import { sqlitePath } from "../env"
import * as schema from "./schema"

const sqlite = new Database(sqlitePath())
sqlite.run(`PRAGMA foreign_keys = ON`)

export const db = drizzle(sqlite, { schema })

export function bootstrapSchema(): void {
	sqlite.run(`
		CREATE TABLE IF NOT EXISTS users (
			id TEXT PRIMARY KEY,
			display_name TEXT NOT NULL,
			email TEXT NOT NULL UNIQUE,
			authentik_subject TEXT UNIQUE,
			avatar_color TEXT NOT NULL,
			created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
		)
	`)
	sqlite.run(`
		CREATE TABLE IF NOT EXISTS groups (
			id TEXT PRIMARY KEY,
			name TEXT NOT NULL,
			authentik_group TEXT NOT NULL UNIQUE,
			created_by_user_id TEXT NOT NULL REFERENCES users(id),
			created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
		)
	`)
	sqlite.run(`
		CREATE TABLE IF NOT EXISTS memberships (
			id TEXT PRIMARY KEY,
			group_id TEXT NOT NULL REFERENCES groups(id),
			user_id TEXT NOT NULL REFERENCES users(id),
			role TEXT NOT NULL DEFAULT 'member',
			created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
			CONSTRAINT memberships_group_user_unique UNIQUE (group_id, user_id)
		)
	`)
	sqlite.run(`
		CREATE TABLE IF NOT EXISTS invites (
			id TEXT PRIMARY KEY,
			group_id TEXT NOT NULL REFERENCES groups(id),
			email TEXT NOT NULL,
			token TEXT NOT NULL UNIQUE,
			status TEXT NOT NULL DEFAULT 'pending',
			created_by_user_id TEXT NOT NULL REFERENCES users(id),
			created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
			accepted_at TEXT
		)
	`)
	sqlite.run(`
		CREATE TABLE IF NOT EXISTS movies (
			id TEXT PRIMARY KEY,
			title TEXT NOT NULL,
			year INTEGER,
			description TEXT,
			poster_path TEXT,
			metadata_source TEXT NOT NULL DEFAULT 'manual',
			source_id TEXT,
			created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
			CONSTRAINT movies_source_unique UNIQUE (metadata_source, source_id)
		)
	`)
	sqlite.run(`
		CREATE TABLE IF NOT EXISTS advocates (
			id TEXT PRIMARY KEY,
			group_id TEXT NOT NULL REFERENCES groups(id),
			movie_id TEXT NOT NULL REFERENCES movies(id),
			user_id TEXT NOT NULL REFERENCES users(id),
			advocate_number INTEGER NOT NULL,
			rank REAL NOT NULL,
			created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
			CONSTRAINT advocates_group_movie_number_unique UNIQUE (group_id, movie_id, advocate_number),
			CONSTRAINT advocates_group_user_movie_unique UNIQUE (group_id, user_id, movie_id),
			CONSTRAINT advocates_group_user_rank_unique UNIQUE (group_id, user_id, rank)
		)
	`)
	sqlite.run(
		`CREATE INDEX IF NOT EXISTS advocates_personal_rank_idx ON advocates(group_id, user_id, rank)`,
	)
	sqlite.run(`
		CREATE TABLE IF NOT EXISTS queue_entries (
			id TEXT PRIMARY KEY,
			group_id TEXT NOT NULL REFERENCES groups(id),
			movie_id TEXT NOT NULL REFERENCES movies(id),
			added_by_user_id TEXT NOT NULL REFERENCES users(id),
			position REAL NOT NULL,
			status TEXT NOT NULL DEFAULT 'queued',
			created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
			CONSTRAINT queue_entries_group_position_unique UNIQUE (group_id, position),
			CONSTRAINT queue_entries_group_movie_status_unique UNIQUE (group_id, movie_id, status)
		)
	`)
	sqlite.run(`
		CREATE TABLE IF NOT EXISTS turn_order_entries (
			id TEXT PRIMARY KEY,
			group_id TEXT NOT NULL REFERENCES groups(id),
			user_id TEXT NOT NULL REFERENCES users(id),
			position INTEGER NOT NULL,
			CONSTRAINT turn_order_group_position_unique UNIQUE (group_id, position),
			CONSTRAINT turn_order_group_user_unique UNIQUE (group_id, user_id)
		)
	`)
	sqlite.run(`
		CREATE TABLE IF NOT EXISTS movie_nights (
			id TEXT PRIMARY KEY,
			group_id TEXT NOT NULL REFERENCES groups(id),
			movie_id TEXT NOT NULL REFERENCES movies(id),
			queue_entry_id TEXT REFERENCES queue_entries(id),
			chosen_by_user_id TEXT REFERENCES users(id),
			date_watched TEXT NOT NULL,
			created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
		)
	`)
	sqlite.run(`
		CREATE TABLE IF NOT EXISTS group_reviews (
			id TEXT PRIMARY KEY,
			group_id TEXT NOT NULL REFERENCES groups(id),
			movie_id TEXT NOT NULL REFERENCES movies(id),
			movie_night_id TEXT NOT NULL REFERENCES movie_nights(id),
			user_id TEXT NOT NULL REFERENCES users(id),
			goodness_of_pick INTEGER NOT NULL,
			created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
			CONSTRAINT group_reviews_user_group_movie_night_unique UNIQUE (user_id, group_id, movie_id, movie_night_id)
		)
	`)
	sqlite.run(`
		CREATE TABLE IF NOT EXISTS individual_reviews (
			id TEXT PRIMARY KEY,
			movie_id TEXT NOT NULL REFERENCES movies(id),
			movie_night_id TEXT NOT NULL REFERENCES movie_nights(id),
			user_id TEXT NOT NULL REFERENCES users(id),
			rating INTEGER NOT NULL,
			feelings TEXT,
			created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
			CONSTRAINT individual_reviews_user_movie_night_unique UNIQUE (user_id, movie_id, movie_night_id)
		)
	`)
}
