import type { Config } from "drizzle-kit";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

export default {
  schema: [
    "./src/core/lib/db/baseSchema.ts",
    "./src/core/lib/db/permissionSchema.ts",
    "./src/modules/**/schemas/*Schema.ts"
  ],
  out: "./drizzle/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
} satisfies Config;