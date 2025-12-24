CREATE TABLE "access_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token_hash" varchar(255) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"revoked" boolean DEFAULT false NOT NULL,
	"revoked_at" timestamp,
	"ip_address" varchar(45),
	"user_agent" text
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"tenant_id" uuid,
	"action" varchar(100) NOT NULL,
	"resource_type" varchar(100),
	"resource_id" uuid,
	"changes" jsonb,
	"ip_address" varchar(45),
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth_providers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"provider" varchar(100) NOT NULL,
	"provider_user_id" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "modules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"code" varchar(100) NOT NULL,
	"description" text,
	"icon" varchar(100),
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_by" uuid,
	CONSTRAINT "modules_name_unique" UNIQUE("name"),
	CONSTRAINT "modules_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "password_reset_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token" varchar(255) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"used_at" timestamp,
	"ip_address" varchar(45),
	CONSTRAINT "password_reset_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "permission_group_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" uuid NOT NULL,
	"permission_id" uuid NOT NULL,
	CONSTRAINT "permission_group_items_unique" UNIQUE("group_id","permission_id")
);
--> statement-breakpoint
CREATE TABLE "permission_groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid,
	"name" varchar(100) NOT NULL,
	"code" varchar(50) NOT NULL,
	"description" text,
	"is_system" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "permission_groups_tenant_code_unique" UNIQUE("tenant_id","code")
);
--> statement-breakpoint
CREATE TABLE "permissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(100) NOT NULL,
	"name" varchar(255) NOT NULL,
	"module" varchar(50) NOT NULL,
	"resource" varchar(50),
	"action" varchar(50) NOT NULL,
	"description" text,
	"is_dangerous" boolean DEFAULT false NOT NULL,
	"requires_mfa" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "permissions_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "refresh_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token_hash" varchar(255) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"revoked" boolean DEFAULT false NOT NULL,
	"revoked_at" timestamp,
	"ip_address" varchar(45),
	"user_agent" text
);
--> statement-breakpoint
CREATE TABLE "resource_permissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"tenant_id" uuid NOT NULL,
	"resource_type" varchar(50) NOT NULL,
	"resource_id" uuid NOT NULL,
	"permission_code" varchar(100) NOT NULL,
	"granted_by" uuid,
	"valid_from" timestamp DEFAULT now(),
	"valid_until" timestamp,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "resource_permissions_unique" UNIQUE("user_id","resource_type","resource_id","permission_code")
);
--> statement-breakpoint
CREATE TABLE "role_permissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"role_id" uuid NOT NULL,
	"permission_id" uuid NOT NULL,
	"conditions" jsonb,
	"granted_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "role_permissions_role_permission_unique" UNIQUE("role_id","permission_id")
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid,
	"parent_role_id" uuid,
	"name" varchar(100) NOT NULL,
	"code" varchar(50) NOT NULL,
	"description" text,
	"is_system" boolean DEFAULT false NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"priority" integer DEFAULT 0 NOT NULL,
	"color" varchar(7),
	"max_users" integer,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "roles_tenant_code_unique" UNIQUE("tenant_id","code")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"tenant_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"ip_address" varchar(45),
	"user_agent" text,
	"last_activity" timestamp DEFAULT now(),
	"expires_at" timestamp NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sessions_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "tenant_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role_id" uuid,
	"is_primary" boolean DEFAULT false NOT NULL,
	"joined_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tenant_users_tenant_user_unique" UNIQUE("tenant_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "tenants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"settings" jsonb DEFAULT '{}'::jsonb,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"plan" varchar(50) DEFAULT 'free' NOT NULL,
	"max_users" integer DEFAULT 10,
	"trial_ends_at" timestamp,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "tenants_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "user_roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"role_id" uuid NOT NULL,
	"tenant_id" uuid NOT NULL,
	"granted_by" uuid,
	"valid_from" timestamp DEFAULT now(),
	"valid_until" timestamp,
	"is_active" boolean DEFAULT true NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"assigned_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_roles_user_role_tenant_unique" UNIQUE("user_id","role_id","tenant_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255),
	"full_name" varchar(255),
	"avatar_url" text,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"two_factor_enabled" boolean DEFAULT false NOT NULL,
	"two_factor_secret" text,
	"timezone" varchar(50) DEFAULT 'UTC',
	"locale" varchar(10) DEFAULT 'en',
	"last_login_at" timestamp,
	"last_login_ip" varchar(45),
	"failed_login_attempts" integer DEFAULT 0 NOT NULL,
	"locked_until" timestamp,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "users_tenant_email_unique" UNIQUE("tenant_id","email")
);
--> statement-breakpoint
CREATE TABLE "notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"content" text NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "access_tokens" ADD CONSTRAINT "access_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth_providers" ADD CONSTRAINT "auth_providers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "permission_group_items" ADD CONSTRAINT "permission_group_items_group_id_permission_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."permission_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "permission_group_items" ADD CONSTRAINT "permission_group_items_permission_id_permissions_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "permission_groups" ADD CONSTRAINT "permission_groups_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resource_permissions" ADD CONSTRAINT "resource_permissions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resource_permissions" ADD CONSTRAINT "resource_permissions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resource_permissions" ADD CONSTRAINT "resource_permissions_granted_by_users_id_fk" FOREIGN KEY ("granted_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_permissions_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roles" ADD CONSTRAINT "roles_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_users" ADD CONSTRAINT "tenant_users_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_users" ADD CONSTRAINT "tenant_users_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_users" ADD CONSTRAINT "tenant_users_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_granted_by_users_id_fk" FOREIGN KEY ("granted_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notes" ADD CONSTRAINT "notes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_access_tokens_user" ON "access_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_access_tokens_hash" ON "access_tokens" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "idx_audit_logs_user" ON "audit_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_audit_logs_tenant" ON "audit_logs" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_audit_logs_resource" ON "audit_logs" USING btree ("resource_type","resource_id");--> statement-breakpoint
CREATE INDEX "idx_audit_logs_created" ON "audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_auth_providers_user" ON "auth_providers" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_modules_code" ON "modules" USING btree ("code");--> statement-breakpoint
CREATE INDEX "idx_password_reset_tokens_user" ON "password_reset_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_password_reset_tokens_token" ON "password_reset_tokens" USING btree ("token");--> statement-breakpoint
CREATE INDEX "idx_password_reset_tokens_expires" ON "password_reset_tokens" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "idx_pg_items_group" ON "permission_group_items" USING btree ("group_id");--> statement-breakpoint
CREATE INDEX "idx_permissions_code" ON "permissions" USING btree ("code");--> statement-breakpoint
CREATE INDEX "idx_permissions_module" ON "permissions" USING btree ("module");--> statement-breakpoint
CREATE INDEX "idx_permissions_dangerous" ON "permissions" USING btree ("is_dangerous");--> statement-breakpoint
CREATE INDEX "idx_refresh_tokens_user" ON "refresh_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_refresh_tokens_hash" ON "refresh_tokens" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "idx_resource_permissions_user" ON "resource_permissions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_resource_permissions_resource" ON "resource_permissions" USING btree ("resource_type","resource_id");--> statement-breakpoint
CREATE INDEX "idx_resource_permissions_temporal" ON "resource_permissions" USING btree ("valid_from","valid_until");--> statement-breakpoint
CREATE INDEX "idx_role_permissions_role" ON "role_permissions" USING btree ("role_id");--> statement-breakpoint
CREATE INDEX "idx_role_permissions_permission" ON "role_permissions" USING btree ("permission_id");--> statement-breakpoint
CREATE INDEX "idx_role_permissions_conditions" ON "role_permissions" USING btree ("conditions");--> statement-breakpoint
CREATE INDEX "idx_roles_tenant" ON "roles" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_roles_code" ON "roles" USING btree ("code");--> statement-breakpoint
CREATE INDEX "idx_roles_status" ON "roles" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_roles_parent" ON "roles" USING btree ("parent_role_id");--> statement-breakpoint
CREATE INDEX "idx_roles_priority" ON "roles" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "idx_sessions_user" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_sessions_expires" ON "sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "idx_sessions_activity" ON "sessions" USING btree ("last_activity");--> statement-breakpoint
CREATE INDEX "idx_tenant_users_tenant" ON "tenant_users" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_tenant_users_user" ON "tenant_users" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_tenants_slug" ON "tenants" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "idx_tenants_status" ON "tenants" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_tenants_plan" ON "tenants" USING btree ("plan");--> statement-breakpoint
CREATE INDEX "idx_user_roles_user" ON "user_roles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_user_roles_role" ON "user_roles" USING btree ("role_id");--> statement-breakpoint
CREATE INDEX "idx_user_roles_tenant" ON "user_roles" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_user_roles_temporal" ON "user_roles" USING btree ("valid_from","valid_until");--> statement-breakpoint
CREATE INDEX "idx_users_email" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_users_tenant" ON "users" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_users_deleted" ON "users" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "idx_users_status" ON "users" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_users_locked" ON "users" USING btree ("locked_until");