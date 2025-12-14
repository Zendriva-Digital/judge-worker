import { pgEnum } from "drizzle-orm/pg-core";

export const currencyEnum = pgEnum("currency_type", [
	"token",
	"energy",
	"rune",
	"xp",
]);
export const transactionTypeEnum = pgEnum("transaction_type", [
	"credit",
	"debit",
]);
export const courseFormatEnum = pgEnum("course_format", [
	"live",
	"written",
	"podcast",
]);
export const questionTypeEnum = pgEnum("question_type", [
	"multiple_choice",
	"essay",
	"file_upload",
]);
export const courseStatusEnum = pgEnum("course_status", [
	"unverified",
	"verified",
	"rejected",
]);
