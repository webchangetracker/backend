import {
  integer,
  pgEnum,
  pgTable,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  fullName: varchar({ length: 255 }).notNull(),
  email: varchar({ length: 255 }).notNull().unique(),
  passwordHash: varchar({ length: 255 }).notNull(),
});

export const trackerCompareModesEnum = pgEnum("tracker_compare_modes", [
  "innerText",
  "innerHtml",
]);

export const trackersTable = pgTable("trackers", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: integer().references(() => usersTable.id),
  name: varchar({ length: 255 }).notNull(),
  cronExpr: varchar({ length: 255 }).notNull(),
  compareMode: trackerCompareModesEnum("compare_mode").notNull(),
  websiteUrl: varchar({ length: 2550 }).notNull(),
  selector: varchar({ length: 255 }).notNull(),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow(),
});
