CREATE TABLE IF NOT EXISTS "user_body_metrics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_profile_id" uuid NOT NULL,
	"height_cm" double precision NOT NULL,
	"weight_kg" double precision NOT NULL,
	"target_weight_kg" double precision,
	"waist_cm" double precision,
	"body_fat_percentage" double precision,
	CONSTRAINT "user_body_metrics_user_profile_id_unique" UNIQUE("user_profile_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_demographics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_profile_id" uuid NOT NULL,
	"country" varchar(255) NOT NULL,
	"state" varchar(255) NOT NULL,
	"city" varchar(255) NOT NULL,
	"ethnicity" varchar(255),
	CONSTRAINT "user_demographics_user_profile_id_unique" UNIQUE("user_profile_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_dietary_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_profile_id" uuid NOT NULL,
	"diet_type" "diet_type_enum" NOT NULL,
	"allergies" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"disliked_foods" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"preferred_cuisine" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	CONSTRAINT "user_dietary_preferences_user_profile_id_unique" UNIQUE("user_profile_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_health" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_profile_id" uuid NOT NULL,
	"conditions" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"medications" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"smoking" boolean DEFAULT false NOT NULL,
	"alcohol" boolean DEFAULT false NOT NULL,
	CONSTRAINT "user_health_user_profile_id_unique" UNIQUE("user_profile_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_lifestyle" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_profile_id" uuid NOT NULL,
	"activity_level" "activity_level_enum" NOT NULL,
	"occupation" varchar(255),
	"workout_days_per_week" integer,
	"sleep_hours" double precision,
	CONSTRAINT "user_lifestyle_user_profile_id_unique" UNIQUE("user_profile_id")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_body_metrics" ADD CONSTRAINT "user_body_metrics_user_profile_id_user_profiles_id_fk" FOREIGN KEY ("user_profile_id") REFERENCES "public"."user_profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_demographics" ADD CONSTRAINT "user_demographics_user_profile_id_user_profiles_id_fk" FOREIGN KEY ("user_profile_id") REFERENCES "public"."user_profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_dietary_preferences" ADD CONSTRAINT "user_dietary_preferences_user_profile_id_user_profiles_id_fk" FOREIGN KEY ("user_profile_id") REFERENCES "public"."user_profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_health" ADD CONSTRAINT "user_health_user_profile_id_user_profiles_id_fk" FOREIGN KEY ("user_profile_id") REFERENCES "public"."user_profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_lifestyle" ADD CONSTRAINT "user_lifestyle_user_profile_id_user_profiles_id_fk" FOREIGN KEY ("user_profile_id") REFERENCES "public"."user_profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "user_profiles" DROP COLUMN IF EXISTS "height_cm";--> statement-breakpoint
ALTER TABLE "user_profiles" DROP COLUMN IF EXISTS "weight_kg";--> statement-breakpoint
ALTER TABLE "user_profiles" DROP COLUMN IF EXISTS "target_weight_kg";--> statement-breakpoint
ALTER TABLE "user_profiles" DROP COLUMN IF EXISTS "waist_cm";--> statement-breakpoint
ALTER TABLE "user_profiles" DROP COLUMN IF EXISTS "body_fat_percentage";--> statement-breakpoint
ALTER TABLE "user_profiles" DROP COLUMN IF EXISTS "country";--> statement-breakpoint
ALTER TABLE "user_profiles" DROP COLUMN IF EXISTS "state";--> statement-breakpoint
ALTER TABLE "user_profiles" DROP COLUMN IF EXISTS "city";--> statement-breakpoint
ALTER TABLE "user_profiles" DROP COLUMN IF EXISTS "ethnicity";--> statement-breakpoint
ALTER TABLE "user_profiles" DROP COLUMN IF EXISTS "activity_level";--> statement-breakpoint
ALTER TABLE "user_profiles" DROP COLUMN IF EXISTS "occupation";--> statement-breakpoint
ALTER TABLE "user_profiles" DROP COLUMN IF EXISTS "workout_days_per_week";--> statement-breakpoint
ALTER TABLE "user_profiles" DROP COLUMN IF EXISTS "sleep_hours";--> statement-breakpoint
ALTER TABLE "user_profiles" DROP COLUMN IF EXISTS "diet_type";--> statement-breakpoint
ALTER TABLE "user_profiles" DROP COLUMN IF EXISTS "allergies";--> statement-breakpoint
ALTER TABLE "user_profiles" DROP COLUMN IF EXISTS "disliked_foods";--> statement-breakpoint
ALTER TABLE "user_profiles" DROP COLUMN IF EXISTS "preferred_cuisine";--> statement-breakpoint
ALTER TABLE "user_profiles" DROP COLUMN IF EXISTS "conditions";--> statement-breakpoint
ALTER TABLE "user_profiles" DROP COLUMN IF EXISTS "medications";--> statement-breakpoint
ALTER TABLE "user_profiles" DROP COLUMN IF EXISTS "smoking";--> statement-breakpoint
ALTER TABLE "user_profiles" DROP COLUMN IF EXISTS "alcohol";