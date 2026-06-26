#!/usr/bin/env bun
import { copyFile, mkdir } from "node:fs/promises"

const target = process.env.CELILO_BACKUP_DIR ?? `/var/backups/moview`
await mkdir(target, { recursive: true })
await copyFile(`/var/lib/moview/moview.sqlite`, `${target}/moview.sqlite`)
console.log(`Moview SQLite backup completed.`)
