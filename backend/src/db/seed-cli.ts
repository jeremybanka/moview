import { bootstrapSchema } from "./client"
import { seedDevData } from "./seed"

bootstrapSchema()
await seedDevData()
