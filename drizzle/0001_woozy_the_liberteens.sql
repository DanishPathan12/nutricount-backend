DO $$ BEGIN
 CREATE TYPE "public"."activity_level_enum" AS ENUM('sedentary', 'light', 'moderate', 'active', 'very_active');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."diet_type_enum" AS ENUM('vegetarian', 'vegan', 'non_vegetarian', 'eggetarian');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."gender_enum" AS ENUM('male', 'female', 'other');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."goal_enum" AS ENUM('lose_weight', 'maintain', 'gain_muscle', 'gain_weight');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"first_name" varchar(255) NOT NULL,
	"last_name" varchar(255) NOT NULL,
	"age" integer NOT NULL,
	"gender" "gender_enum" NOT NULL,
	"date_of_birth" date NOT NULL,
	"height_cm" double precision NOT NULL,
	"weight_kg" double precision NOT NULL,
	"target_weight_kg" double precision,
	"waist_cm" double precision,
	"body_fat_percentage" double precision,
	"country" varchar(255) NOT NULL,
	"state" varchar(255) NOT NULL,
	"city" varchar(255) NOT NULL,
	"ethnicity" varchar(255),
	"activity_level" "activity_level_enum" NOT NULL,
	"occupation" varchar(255),
	"workout_days_per_week" integer,
	"sleep_hours" double precision,
	"goal" "goal_enum" NOT NULL,
	"target_calories" integer,
	"diet_type" "diet_type_enum" NOT NULL,
	"allergies" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"disliked_foods" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"preferred_cuisine" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"conditions" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"medications" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"smoking" boolean DEFAULT false NOT NULL,
	"alcohol" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "user_id_idx" ON "user_profiles" ("user_id");