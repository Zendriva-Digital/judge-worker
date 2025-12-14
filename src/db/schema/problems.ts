import { pgTable, text, integer, timestamp, jsonb } from "drizzle-orm/pg-core";

export const problems = pgTable("problems", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	title: text("title").notNull(),
	slug: text("slug").unique().notNull(),
	description: text("description"),
	timeLimitMs: integer("time_limit_ms").notNull(),
	memoryLimitKb: integer("memory_limit_kb").notNull(),
	testcases: jsonb("testcases")
		.$type<
			{
				input: string;
				output: string;
			}[]
		>()
		.notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});
