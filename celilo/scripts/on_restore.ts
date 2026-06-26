#!/usr/bin/env bun
import { copyFile } from "node:fs/promises"

const source = process.env.CELILO_RESTORE_DIR ?? `/var/backups/moview`
await copyFile(`${source}/moview.sqlite`, `/var/lib/moview/moview.sqlite`)
console.log(`Moview SQLite restore completed.`)
