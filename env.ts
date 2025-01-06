import z from "zod";
import dotenv from "dotenv";

dotenv.config();

const envSchema = z.object({
  PORT: z.string().transform(Number),
  DATABASE_URL: z.string(),
  JWT_SECRET: z.string(),
});

export const ENV = envSchema.parse(process.env);
