CREATE TABLE "attempts" (
	"id" serial PRIMARY KEY NOT NULL,
	"learner_id" uuid NOT NULL,
	"question_id" integer NOT NULL,
	"mode" varchar(10) NOT NULL,
	"answer" varchar(120) NOT NULL,
	"correct" boolean NOT NULL,
	"xp_awarded" integer DEFAULT 0 NOT NULL,
	"activity_date" varchar(10) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chapters" (
	"id" integer PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"position" integer NOT NULL,
	"content" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "learners" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"display_name" varchar(60) DEFAULT 'مستكشف جديد' NOT NULL,
	"progress" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "questions" (
	"id" integer PRIMARY KEY NOT NULL,
	"chapter_id" integer,
	"stage_id" varchar(20) NOT NULL,
	"type" varchar(16) NOT NULL,
	"difficulty" varchar(20) NOT NULL,
	"content" jsonb NOT NULL
);
--> statement-breakpoint
ALTER TABLE "attempts" ADD CONSTRAINT "attempts_learner_id_learners_id_fk" FOREIGN KEY ("learner_id") REFERENCES "public"."learners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attempts" ADD CONSTRAINT "attempts_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_chapter_id_chapters_id_fk" FOREIGN KEY ("chapter_id") REFERENCES "public"."chapters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "attempts_learner_idx" ON "attempts" USING btree ("learner_id","created_at");--> statement-breakpoint
CREATE INDEX "learners_created_idx" ON "learners" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "questions_stage_idx" ON "questions" USING btree ("stage_id");