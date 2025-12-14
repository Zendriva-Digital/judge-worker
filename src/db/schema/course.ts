// HAPUS import uuid dan serial agar tidak salah pakai
import {
	pgTable,
	text,
	integer,
	timestamp,
	primaryKey,
	real,
} from "drizzle-orm/pg-core";
import { user } from "./auth";
import { courseFormatEnum, questionTypeEnum, courseStatusEnum } from "./enums";

export const categories = pgTable("categories", {
	id: text("id")
		.primaryKey()
		.notNull()
		.$defaultFn(() => crypto.randomUUID()),
	name: text("name").notNull(),
	slug: text("slug").unique().notNull(),
	thumbnail: text("thumbnail"),
	description: text("description"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const courses = pgTable("courses", {
	id: text("id")
		.primaryKey()
		.notNull()
		.$defaultFn(() => crypto.randomUUID()),
	categoryId: text("category_id")
		.references(() => categories.id, { onDelete: "cascade" })
		.notNull(), // FK: TEXT
	title: text("title").notNull(),
	slug: text("slug").unique().notNull(),
	description: text("description"),
	format: courseFormatEnum("format").default("live").notNull(),

	price: integer("price").default(0).notNull(),
	rating: real("rating").default(0).notNull(),
	duration: integer("duration"),
	capacity: integer("capacity"),

	status: courseStatusEnum("status").default("unverified").notNull(),
	rejectionReason: text("rejection_reason"),

	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const courseMaterials = pgTable("course_materials", {
	id: text("id")
		.primaryKey()
		.notNull()
		.$defaultFn(() => crypto.randomUUID()),
	courseId: text("course_id")
		.references(() => courses.id, { onDelete: "cascade" })
		.notNull(), // FK: TEXT
	title: text("title").notNull(),
	url: text("url").notNull(),
	type: text("type").default("file").notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const courseSessions = pgTable("course_sessions", {
	id: text("id")
		.primaryKey()
		.notNull()
		.$defaultFn(() => crypto.randomUUID()),
	courseId: text("course_id")
		.references(() => courses.id, { onDelete: "cascade" })
		.notNull(), // FK: TEXT
	tutorId: text("tutor_id")
		.references(() => user.id, { onDelete: "restrict" })
		.notNull(), // FK: TEXT
	date: timestamp("date").notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const quizzes = pgTable("quizzes", {
	id: text("id").primaryKey(), // Primary Key: TEXT
	courseId: text("course_id")
		.references(() => courses.id, { onDelete: "cascade" })
		.notNull(), // FK: TEXT
	title: text("title").notNull(),
	description: text("description"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const questions = pgTable("questions", {
	id: text("id")
		.primaryKey()
		.notNull()
		.$defaultFn(() => crypto.randomUUID()),
	quizId: text("quiz_id")
		.references(() => quizzes.id, { onDelete: "cascade" })
		.notNull(), // FK: TEXT
	content: text("content").notNull(),
	type: questionTypeEnum("type").default("multiple_choice").notNull(),
	options: text("options").array(),
	correctAnswer: text("correct_answer"),
	points: integer("points").default(10).notNull(),
	order: integer("order").notNull(),
});

export const courseTutors = pgTable(
	"course_tutors",
	{
		courseId: text("course_id")
			.references(() => courses.id, { onDelete: "cascade" })
			.notNull(), // FK: TEXT
		userId: text("user_id")
			.references(() => user.id, { onDelete: "cascade" })
			.notNull(), // FK: TEXT
	},
	(t) => ({
		pk: primaryKey({ columns: [t.courseId, t.userId] }),
	}),
);

export const courseSessionParticipants = pgTable(
	"course_session_participants",
	{
		sessionId: text("session_id")
			.references(() => courseSessions.id, { onDelete: "cascade" })
			.notNull(), // FK: TEXT
		userId: text("user_id")
			.references(() => user.id, { onDelete: "cascade" })
			.notNull(), // FK: TEXT
		joinedAt: timestamp("joined_at").defaultNow(),
	},
	(t) => ({
		pk: primaryKey({ columns: [t.sessionId, t.userId] }),
	}),
);
