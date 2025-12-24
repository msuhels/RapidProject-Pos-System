ALTER TABLE "projects" RENAME COLUMN "labels" TO "label_ids";--> statement-breakpoint
ALTER TABLE "tasks" RENAME COLUMN "labels" TO "label_ids";--> statement-breakpoint
ALTER TABLE "tasks" DROP CONSTRAINT "tasks_parent_task_id_fkey";
