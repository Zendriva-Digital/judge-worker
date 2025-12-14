import { pgTable, text, integer, timestamp, uuid } from "drizzle-orm/pg-core";
import { user } from "./auth";
import { currencyEnum, transactionTypeEnum } from "./enums";

export const wallets = pgTable("wallets", {
	id: uuid("id").defaultRandom().primaryKey(),
	userId: text("user_id")
		.references(() => user.id, { onDelete: "cascade" })
		.notNull()
		.unique(),
	token: integer("token").default(0).notNull(),
	energy: integer("energy").default(10).notNull(),
	rune: integer("rune").default(0).notNull(),
	xp: integer("xp").default(0).notNull(),
	currentStreak: integer("current_streak").default(0).notNull(),
	longestStreak: integer("longest_streak").default(0).notNull(),
	lastStreakUpdate: timestamp("last_streak_update"),
	lastEnergyRefill: timestamp("last_energy_refill").defaultNow(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const walletTransactions = pgTable("wallet_transactions", {
	id: uuid("id").defaultRandom().primaryKey(),
	walletId: uuid("wallet_id")
		.references(() => wallets.id, { onDelete: "cascade" })
		.notNull(),
	currency: currencyEnum("currency").notNull(),
	amount: integer("amount").notNull(),
	type: transactionTypeEnum("type").notNull(),
	description: text("description"),
	referenceId: text("reference_id"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});
