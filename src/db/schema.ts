import { boolean, index, integer, jsonb, pgTable, serial, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import type { ProgressData, Question } from "@/lib/types";

export const chapters = pgTable("chapters", {
  id: integer("id").primaryKey(),
  title: text("title").notNull(),
  position: integer("position").notNull(),
  content: jsonb("content").notNull(),
});

export const questions = pgTable("questions", {
  id: integer("id").primaryKey(),
  chapterId: integer("chapter_id").references(() => chapters.id, { onDelete: "cascade" }),
  stageId: varchar("stage_id", { length: 20 }).notNull(),
  type: varchar("type", { length: 16 }).notNull(),
  difficulty: varchar("difficulty", { length: 20 }).notNull(),
  content: jsonb("content").$type<Question>().notNull(),
}, (table) => [index("questions_stage_idx").on(table.stageId)]);

export const learners = pgTable("learners", {
  id: uuid("id").primaryKey().defaultRandom(),
  displayName: varchar("display_name", { length: 60 }).notNull().default("مستكشف جديد"),
  progress: jsonb("progress").$type<ProgressData>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("learners_created_idx").on(table.createdAt)]);

export const attempts = pgTable("attempts", {
  id: serial("id").primaryKey(),
  learnerId: uuid("learner_id").notNull().references(() => learners.id, { onDelete: "cascade" }),
  questionId: integer("question_id").notNull().references(() => questions.id),
  mode: varchar("mode", { length: 10 }).notNull(),
  answer: varchar("answer", { length: 120 }).notNull(),
  correct: boolean("correct").notNull(),
  xpAwarded: integer("xp_awarded").notNull().default(0),
  activityDate: varchar("activity_date", { length: 10 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("attempts_learner_idx").on(table.learnerId, table.createdAt)]);
