import { defineConfig } from "drizzle-kit";
// @ts-ignore
import { ENV } from "./env";

export default defineConfig({
  out: "./drizzle",
  schema: "./src/db/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: ENV.DATABASE_URL,
  },
});
