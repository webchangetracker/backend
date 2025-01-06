import { ENV } from "../../env";
import { drizzle } from "drizzle-orm/node-postgres";

export const db = drizzle(ENV.DATABASE_URL);
