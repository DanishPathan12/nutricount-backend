DO $$ BEGIN
 CREATE TYPE "public"."meal_type_enum" AS ENUM('breakfast', 'lunch', 'dinner', 'snack', 'other');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "daily_meals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"meal_date" date NOT NULL,
	"meal_time" varchar(20),
	"meal_type" "meal_type_enum" NOT NULL,
	"meal_name" varchar(255) NOT NULL,
	"description" text,
	"image_url" text,
	"calories" double precision DEFAULT 0 NOT NULL,
	"protein" double precision DEFAULT 0 NOT NULL,
	"carbs" double precision DEFAULT 0 NOT NULL,
	"fat" double precision DEFAULT 0 NOT NULL,
	"fiber" double precision DEFAULT 0,
	"sugar" double precision DEFAULT 0,
	"breakdown" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"health_score" integer,
	"ai_analysis" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "daily_meals" ADD CONSTRAINT "daily_meals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "daily_meals_user_id_idx" ON "daily_meals" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "daily_meals_meal_date_idx" ON "daily_meals" ("meal_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "daily_meals_user_meal_date_idx" ON "daily_meals" ("user_id", "meal_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "daily_meals_created_at_idx" ON "daily_meals" ("created_at");
