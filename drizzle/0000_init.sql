CREATE TYPE "public"."blood_group" AS ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-');--> statement-breakpoint
CREATE TYPE "public"."donation_type" AS ENUM('WHOLE_BLOOD', 'PLASMA');--> statement-breakpoint
CREATE TYPE "public"."notification_channel" AS ENUM('SMS', 'IN_APP');--> statement-breakpoint
CREATE TYPE "public"."notification_status" AS ENUM('SENT', 'LOGGED', 'FAILED', 'SKIPPED');--> statement-breakpoint
CREATE TYPE "public"."request_status" AS ENUM('OPEN', 'FULFILLED', 'CANCELLED', 'EXPIRED');--> statement-breakpoint
CREATE TYPE "public"."response_status" AS ENUM('NOTIFIED', 'ACCEPTED', 'DECLINED', 'DONATED');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('DONOR', 'REQUESTER', 'ADMIN');--> statement-breakpoint
CREATE TYPE "public"."sex" AS ENUM('MALE', 'FEMALE', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."urgency" AS ENUM('CRITICAL', 'URGENT', 'STANDARD');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "blood_request" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"requester_id" text NOT NULL,
	"patient_name" text NOT NULL,
	"blood_group" "blood_group" NOT NULL,
	"donation_type" "donation_type" DEFAULT 'WHOLE_BLOOD' NOT NULL,
	"units" integer NOT NULL,
	"hospital_name" text NOT NULL,
	"hospital_address" text NOT NULL,
	"location" "geography" NOT NULL,
	"contact_phone" text NOT NULL,
	"urgency" "urgency" DEFAULT 'URGENT' NOT NULL,
	"status" "request_status" DEFAULT 'OPEN' NOT NULL,
	"notes" text,
	"needed_by" timestamp with time zone NOT NULL,
	"fulfilled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "donor_profile" (
	"user_id" text PRIMARY KEY NOT NULL,
	"blood_group" "blood_group" NOT NULL,
	"sex" "sex" NOT NULL,
	"date_of_birth" date NOT NULL,
	"weight_kg" integer NOT NULL,
	"location" "geography" NOT NULL,
	"area" text NOT NULL,
	"last_donated_at" timestamp with time zone,
	"last_donation_type" "donation_type",
	"is_available" boolean DEFAULT true NOT NULL,
	"sms_opt_in" boolean DEFAULT true NOT NULL,
	"is_demo" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "donor_response" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"request_id" uuid NOT NULL,
	"donor_id" text NOT NULL,
	"status" "response_status" DEFAULT 'NOTIFIED' NOT NULL,
	"distance_m" integer,
	"notified_at" timestamp with time zone DEFAULT now() NOT NULL,
	"responded_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "notification" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"request_id" uuid,
	"channel" "notification_channel" NOT NULL,
	"status" "notification_status" NOT NULL,
	"to" text,
	"body" text NOT NULL,
	"error" text,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"role" "role" DEFAULT 'DONOR' NOT NULL,
	"phone" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blood_request" ADD CONSTRAINT "blood_request_requester_id_user_id_fk" FOREIGN KEY ("requester_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "donor_profile" ADD CONSTRAINT "donor_profile_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "donor_response" ADD CONSTRAINT "donor_response_request_id_blood_request_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."blood_request"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "donor_response" ADD CONSTRAINT "donor_response_donor_id_user_id_fk" FOREIGN KEY ("donor_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification" ADD CONSTRAINT "notification_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification" ADD CONSTRAINT "notification_request_id_blood_request_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."blood_request"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_user_id_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "blood_request_location_gist" ON "blood_request" USING gist ("location");--> statement-breakpoint
CREATE INDEX "blood_request_status_idx" ON "blood_request" USING btree ("status");--> statement-breakpoint
CREATE INDEX "blood_request_requester_idx" ON "blood_request" USING btree ("requester_id");--> statement-breakpoint
CREATE INDEX "donor_profile_location_gist" ON "donor_profile" USING gist ("location");--> statement-breakpoint
CREATE INDEX "donor_profile_blood_group_idx" ON "donor_profile" USING btree ("blood_group");--> statement-breakpoint
CREATE UNIQUE INDEX "donor_response_request_donor_uq" ON "donor_response" USING btree ("request_id","donor_id");--> statement-breakpoint
CREATE INDEX "donor_response_donor_idx" ON "donor_response" USING btree ("donor_id");--> statement-breakpoint
CREATE INDEX "notification_user_idx" ON "notification" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "session_user_id_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");