import { pgTable, text, integer, timestamp } from "drizzle-orm/pg-core";
import { problems } from "./problems";
import { user } from "./auth";

export const submissions = pgTable("submissions", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	userId: text("user_id")
		.references(() => user.id, { onDelete: "cascade" })
		.notNull(),
	problemId: text("problem_id")
		.references(() => problems.id, { onDelete: "cascade" })
		.notNull(),
	language: text("language").notNull(),
	sourceCode: text("source_code").notNull(),
	status: text("status")
		.$type<
			"PENDING" | "RUNNING" | "AC" | "WA" | "TLE" | "MLE" | "CE" | "RE"
		>()
		.default("PENDING")
		.notNull(),
	timeMs: integer("time_ms"),
	memoryKb: integer("memory_kb"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});
