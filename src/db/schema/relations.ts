import { relations } from "drizzle-orm";
import { user } from "./auth";
import { wallets, walletTransactions } from "./wallet";
import {
	categories,
	courses,
	courseMaterials,
	courseSessions,
	quizzes,
	questions,
	courseTutors,
	courseSessionParticipants,
} from "./course";
import { problems } from "./problems";
import { submissions } from "./submissions";

export const userRelations = relations(user, ({ one, many }) => ({
	wallet: one(wallets, {
		fields: [user.id],
		references: [wallets.userId],
	}),
	sessionsTaught: many(courseSessions),
	coursesTaught: many(courseTutors),
	sessionParticipations: many(courseSessionParticipants),
}));

export const walletsRelations = relations(wallets, ({ one, many }) => ({
	user: one(user, {
		fields: [wallets.userId],
		references: [user.id],
	}),
	transactions: many(walletTransactions),
}));

export const walletTransactionsRelations = relations(
	walletTransactions,
	({ one }) => ({
		wallet: one(wallets, {
			fields: [walletTransactions.walletId],
			references: [wallets.id],
		}),
	}),
);

export const categoriesRelations = relations(categories, ({ many }) => ({
	courses: many(courses),
}));

export const coursesRelations = relations(courses, ({ one, many }) => ({
	category: one(categories, {
		fields: [courses.categoryId],
		references: [categories.id],
	}),
	sessions: many(courseSessions),
	materials: many(courseMaterials),
	quizzes: many(quizzes),
	tutors: many(courseTutors),
}));

export const courseMaterialsRelations = relations(
	courseMaterials,
	({ one }) => ({
		course: one(courses, {
			fields: [courseMaterials.courseId],
			references: [courses.id],
		}),
	}),
);

export const courseSessionsRelations = relations(
	courseSessions,
	({ one, many }) => ({
		course: one(courses, {
			fields: [courseSessions.courseId],
			references: [courses.id],
		}),
		tutor: one(user, {
			fields: [courseSessions.tutorId],
			references: [user.id],
		}),
		participants: many(courseSessionParticipants),
	}),
);

export const quizzesRelations = relations(quizzes, ({ one, many }) => ({
	course: one(courses, {
		fields: [quizzes.courseId],
		references: [courses.id],
	}),
	questions: many(questions),
}));

export const questionsRelations = relations(questions, ({ one }) => ({
	quiz: one(quizzes, {
		fields: [questions.quizId],
		references: [quizzes.id],
	}),
}));

export const courseTutorsRelations = relations(courseTutors, ({ one }) => ({
	course: one(courses, {
		fields: [courseTutors.courseId],
		references: [courses.id],
	}),
	tutor: one(user, { fields: [courseTutors.userId], references: [user.id] }),
}));

export const courseSessionParticipantsRelations = relations(
	courseSessionParticipants,
	({ one }) => ({
		session: one(courseSessions, {
			fields: [courseSessionParticipants.sessionId],
			references: [courseSessions.id],
		}),
		participant: one(user, {
			fields: [courseSessionParticipants.userId],
			references: [user.id],
		}),
	}),
);

export const problemsRelations = relations(problems, ({ many }) => ({
	submissions: many(submissions),
}));

export const submissionsRelations = relations(submissions, ({ one }) => ({
	problem: one(problems, {
		fields: [submissions.problemId],
		references: [problems.id],
	}),

	user: one(user, {
		fields: [submissions.userId],
		references: [user.id],
	}),
}));
