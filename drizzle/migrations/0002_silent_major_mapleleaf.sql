DROP TABLE "projects" CASCADE;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "phone_number" varchar(30);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "job_title" varchar(100);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "department" varchar(100);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "company_name" varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "date_of_birth" date;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "bio" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "address_line1" varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "address_line2" varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "city" varchar(100);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "state" varchar(100);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "postal_code" varchar(20);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "country" varchar(100);