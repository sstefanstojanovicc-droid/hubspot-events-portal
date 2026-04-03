-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "email_verified" TIMESTAMP(3),
    "image" TEXT,
    "role" TEXT NOT NULL DEFAULT 'client_user',
    "client_account_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'invited',

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_account_id" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "session_token" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "app_settings" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "app_settings_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "client_accounts" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "hubspot_portal_id" TEXT NOT NULL,
    "website_url" TEXT NOT NULL DEFAULT '',
    "primary_contacts_json" TEXT NOT NULL DEFAULT '[]',
    "connection_status" TEXT NOT NULL DEFAULT 'not_connected',
    "last_hubspot_sync_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "implementation_resources" (
    "id" TEXT NOT NULL,
    "client_account_id" TEXT,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT,
    "content" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "implementation_resources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_knowledge_entries" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "source_url" TEXT,
    "body" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_knowledge_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "manual_package_drafts" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Untitled package',
    "source_hubspot_portal_id" TEXT NOT NULL,
    "items_json" TEXT NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "manual_package_drafts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hubspot_ai_chat_threads" (
    "id" TEXT NOT NULL,
    "client_account_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hubspot_ai_chat_threads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hubspot_ai_chat_messages" (
    "id" TEXT NOT NULL,
    "thread_id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "metadata_json" TEXT NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hubspot_ai_chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hubspot_ai_portal_snapshots" (
    "id" TEXT NOT NULL,
    "client_account_id" TEXT NOT NULL,
    "hubspot_portal_id" TEXT NOT NULL,
    "summary" TEXT,
    "payload_json" TEXT NOT NULL DEFAULT '{}',
    "source" TEXT NOT NULL DEFAULT 'ingestion',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hubspot_ai_portal_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hubspot_ai_write_plans" (
    "id" TEXT NOT NULL,
    "client_account_id" TEXT NOT NULL,
    "hubspot_portal_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "operation_count" INTEGER NOT NULL DEFAULT 0,
    "records_affected" INTEGER,
    "approved_snapshot_json" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "approved_at" TIMESTAMP(3),

    CONSTRAINT "hubspot_ai_write_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hubspot_ai_write_plan_operations" (
    "id" TEXT NOT NULL,
    "write_plan_id" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL,
    "op_type" TEXT NOT NULL,
    "target_object" TEXT,
    "action_summary" TEXT NOT NULL,
    "payload_json" TEXT NOT NULL DEFAULT '{}',
    "payload_summary" TEXT,
    "validation_result_json" TEXT,
    "validation_status" TEXT,
    "hubspot_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hubspot_ai_write_plan_operations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hubspot_ai_execution_runs" (
    "id" TEXT NOT NULL,
    "write_plan_id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "summary" TEXT,

    CONSTRAINT "hubspot_ai_execution_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hubspot_ai_execution_step_logs" (
    "id" TEXT NOT NULL,
    "execution_run_id" TEXT NOT NULL,
    "operation_id" TEXT NOT NULL,
    "request_meta_json" TEXT,
    "response_meta_json" TEXT,
    "success" BOOLEAN NOT NULL,
    "error_message" TEXT,
    "hubspot_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hubspot_ai_execution_step_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invites" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "client_account_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "consumed_at" TIMESTAMP(3),

    CONSTRAINT "invites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_logs" (
    "id" TEXT NOT NULL,
    "client_account_id" TEXT NOT NULL,
    "user_id" TEXT,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT,
    "details" TEXT NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "package_definitions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "source_hubspot_portal_id" TEXT,
    "client_account_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "package_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "package_versions" (
    "id" TEXT NOT NULL,
    "package_id" TEXT NOT NULL,
    "version_label" TEXT NOT NULL,
    "notes" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "package_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "package_installations" (
    "id" TEXT NOT NULL,
    "package_version_id" TEXT NOT NULL,
    "client_account_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'installed',
    "deployed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "package_installations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "action_plan_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "client_account_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "action_plan_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "action_plan_template_tasks" (
    "id" TEXT NOT NULL,
    "template_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "phase_title" TEXT,
    "section_title" TEXT,
    "sort_order" INTEGER NOT NULL,

    CONSTRAINT "action_plan_template_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "action_plans" (
    "id" TEXT NOT NULL,
    "client_account_id" TEXT NOT NULL,
    "template_id" TEXT,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "action_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "action_plan_tasks" (
    "id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "phase_title" TEXT,
    "section_title" TEXT,
    "sort_order" INTEGER NOT NULL,
    "done" BOOLEAN NOT NULL DEFAULT false,
    "due_at" TIMESTAMP(3),
    "assignee_user_id" TEXT,

    CONSTRAINT "action_plan_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "action_plan_task_cards" (
    "id" TEXT NOT NULL,
    "task_id" TEXT NOT NULL,
    "card_type" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL,
    "payload_json" TEXT NOT NULL DEFAULT '{}',

    CONSTRAINT "action_plan_task_cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fathom_calls" (
    "id" TEXT NOT NULL,
    "client_account_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "call_at" TIMESTAMP(3) NOT NULL,
    "attendees_json" TEXT NOT NULL DEFAULT '[]',
    "transcript" TEXT NOT NULL DEFAULT '',
    "summary" TEXT NOT NULL DEFAULT '',
    "extraction_status" TEXT NOT NULL DEFAULT 'pending',
    "source" TEXT NOT NULL DEFAULT 'manual',
    "linked_action_plan_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fathom_calls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_modules" (
    "id" TEXT NOT NULL,
    "client_account_id" TEXT,
    "title" TEXT NOT NULL,
    "content_type" TEXT NOT NULL DEFAULT 'guide',
    "body" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "training_modules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_provider_account_id_key" ON "accounts"("provider", "provider_account_id");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_session_token_key" ON "sessions"("session_token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "verification_tokens"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "client_accounts_slug_key" ON "client_accounts"("slug");

-- CreateIndex
CREATE INDEX "implementation_resources_client_account_id_idx" ON "implementation_resources"("client_account_id");

-- CreateIndex
CREATE INDEX "hubspot_ai_chat_threads_client_account_id_idx" ON "hubspot_ai_chat_threads"("client_account_id");

-- CreateIndex
CREATE INDEX "hubspot_ai_chat_messages_thread_id_idx" ON "hubspot_ai_chat_messages"("thread_id");

-- CreateIndex
CREATE INDEX "hubspot_ai_portal_snapshots_client_account_id_created_at_idx" ON "hubspot_ai_portal_snapshots"("client_account_id", "created_at");

-- CreateIndex
CREATE INDEX "hubspot_ai_write_plans_client_account_id_idx" ON "hubspot_ai_write_plans"("client_account_id");

-- CreateIndex
CREATE INDEX "hubspot_ai_write_plans_status_idx" ON "hubspot_ai_write_plans"("status");

-- CreateIndex
CREATE INDEX "hubspot_ai_write_plan_operations_write_plan_id_idx" ON "hubspot_ai_write_plan_operations"("write_plan_id");

-- CreateIndex
CREATE UNIQUE INDEX "hubspot_ai_write_plan_operations_write_plan_id_sort_order_key" ON "hubspot_ai_write_plan_operations"("write_plan_id", "sort_order");

-- CreateIndex
CREATE INDEX "hubspot_ai_execution_runs_write_plan_id_idx" ON "hubspot_ai_execution_runs"("write_plan_id");

-- CreateIndex
CREATE INDEX "hubspot_ai_execution_step_logs_execution_run_id_idx" ON "hubspot_ai_execution_step_logs"("execution_run_id");

-- CreateIndex
CREATE UNIQUE INDEX "invites_email_key" ON "invites"("email");

-- CreateIndex
CREATE INDEX "activity_logs_client_account_id_created_at_idx" ON "activity_logs"("client_account_id", "created_at");

-- CreateIndex
CREATE INDEX "package_definitions_client_account_id_idx" ON "package_definitions"("client_account_id");

-- CreateIndex
CREATE INDEX "package_versions_package_id_idx" ON "package_versions"("package_id");

-- CreateIndex
CREATE INDEX "package_installations_client_account_id_idx" ON "package_installations"("client_account_id");

-- CreateIndex
CREATE INDEX "action_plan_templates_client_account_id_idx" ON "action_plan_templates"("client_account_id");

-- CreateIndex
CREATE INDEX "action_plan_template_tasks_template_id_idx" ON "action_plan_template_tasks"("template_id");

-- CreateIndex
CREATE INDEX "action_plans_client_account_id_status_idx" ON "action_plans"("client_account_id", "status");

-- CreateIndex
CREATE INDEX "action_plan_tasks_plan_id_idx" ON "action_plan_tasks"("plan_id");

-- CreateIndex
CREATE INDEX "action_plan_task_cards_task_id_idx" ON "action_plan_task_cards"("task_id");

-- CreateIndex
CREATE INDEX "fathom_calls_client_account_id_call_at_idx" ON "fathom_calls"("client_account_id", "call_at");

-- CreateIndex
CREATE INDEX "training_modules_client_account_id_idx" ON "training_modules"("client_account_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_client_account_id_fkey" FOREIGN KEY ("client_account_id") REFERENCES "client_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "implementation_resources" ADD CONSTRAINT "implementation_resources_client_account_id_fkey" FOREIGN KEY ("client_account_id") REFERENCES "client_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hubspot_ai_chat_threads" ADD CONSTRAINT "hubspot_ai_chat_threads_client_account_id_fkey" FOREIGN KEY ("client_account_id") REFERENCES "client_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hubspot_ai_chat_messages" ADD CONSTRAINT "hubspot_ai_chat_messages_thread_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "hubspot_ai_chat_threads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hubspot_ai_portal_snapshots" ADD CONSTRAINT "hubspot_ai_portal_snapshots_client_account_id_fkey" FOREIGN KEY ("client_account_id") REFERENCES "client_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hubspot_ai_write_plans" ADD CONSTRAINT "hubspot_ai_write_plans_client_account_id_fkey" FOREIGN KEY ("client_account_id") REFERENCES "client_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hubspot_ai_write_plan_operations" ADD CONSTRAINT "hubspot_ai_write_plan_operations_write_plan_id_fkey" FOREIGN KEY ("write_plan_id") REFERENCES "hubspot_ai_write_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hubspot_ai_execution_runs" ADD CONSTRAINT "hubspot_ai_execution_runs_write_plan_id_fkey" FOREIGN KEY ("write_plan_id") REFERENCES "hubspot_ai_write_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hubspot_ai_execution_step_logs" ADD CONSTRAINT "hubspot_ai_execution_step_logs_execution_run_id_fkey" FOREIGN KEY ("execution_run_id") REFERENCES "hubspot_ai_execution_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hubspot_ai_execution_step_logs" ADD CONSTRAINT "hubspot_ai_execution_step_logs_operation_id_fkey" FOREIGN KEY ("operation_id") REFERENCES "hubspot_ai_write_plan_operations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_client_account_id_fkey" FOREIGN KEY ("client_account_id") REFERENCES "client_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_definitions" ADD CONSTRAINT "package_definitions_client_account_id_fkey" FOREIGN KEY ("client_account_id") REFERENCES "client_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_versions" ADD CONSTRAINT "package_versions_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "package_definitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_installations" ADD CONSTRAINT "package_installations_package_version_id_fkey" FOREIGN KEY ("package_version_id") REFERENCES "package_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_installations" ADD CONSTRAINT "package_installations_client_account_id_fkey" FOREIGN KEY ("client_account_id") REFERENCES "client_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "action_plan_template_tasks" ADD CONSTRAINT "action_plan_template_tasks_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "action_plan_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "action_plans" ADD CONSTRAINT "action_plans_client_account_id_fkey" FOREIGN KEY ("client_account_id") REFERENCES "client_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "action_plans" ADD CONSTRAINT "action_plans_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "action_plan_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "action_plan_tasks" ADD CONSTRAINT "action_plan_tasks_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "action_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "action_plan_tasks" ADD CONSTRAINT "action_plan_tasks_assignee_user_id_fkey" FOREIGN KEY ("assignee_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "action_plan_task_cards" ADD CONSTRAINT "action_plan_task_cards_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "action_plan_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fathom_calls" ADD CONSTRAINT "fathom_calls_client_account_id_fkey" FOREIGN KEY ("client_account_id") REFERENCES "client_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fathom_calls" ADD CONSTRAINT "fathom_calls_linked_action_plan_id_fkey" FOREIGN KEY ("linked_action_plan_id") REFERENCES "action_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_modules" ADD CONSTRAINT "training_modules_client_account_id_fkey" FOREIGN KEY ("client_account_id") REFERENCES "client_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

