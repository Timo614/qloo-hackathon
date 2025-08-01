class SupabaseMigration < ActiveRecord::Migration[8.0]
  def change
    # Enable required extensions
    enable_extension "pgcrypto"
    enable_extension "uuid-ossp" 
    enable_extension "pg_trgm"

    # Create users table (replacing Supabase auth.users)
    create_table :users, id: :uuid, default: -> { "gen_random_uuid()" } do |t|
      t.string :email, null: false
      t.string :password_digest, null: false
      t.string :first_name
      t.string :last_name
      t.boolean :email_verified, default: false
      t.string :email_verification_token
      t.datetime :email_verified_at
      t.string :password_reset_token
      t.datetime :password_reset_expires_at
      t.timestamps null: false

      t.index :email, unique: true
      t.index :email_verification_token, unique: true
      t.index :password_reset_token, unique: true
    end

    # Good Job tables (background job processing)
    create_table :good_job_batches, id: :uuid, default: -> { "gen_random_uuid()" } do |t|
      t.datetime :created_at, null: false, default: -> { "now()" }
      t.datetime :updated_at, null: false, default: -> { "now()" }
      t.text :description
      t.jsonb :serialized_properties
      t.text :on_finish
      t.text :on_success
      t.text :on_discard
      t.text :callback_queue_name
      t.integer :callback_priority
      t.datetime :enqueued_at
      t.datetime :discarded_at
      t.datetime :finished_at
      t.datetime :jobs_finished_at
    end

    create_table :good_job_executions, id: :uuid, default: -> { "gen_random_uuid()" } do |t|
      t.datetime :created_at, null: false, default: -> { "now()" }
      t.datetime :updated_at, null: false, default: -> { "now()" }
      t.uuid :active_job_id, null: false
      t.text :job_class
      t.text :queue_name
      t.jsonb :serialized_params
      t.datetime :scheduled_at
      t.datetime :finished_at
      t.text :error
      t.integer :error_event, limit: 2
      t.text :error_backtrace, array: true
      t.uuid :process_id
      t.interval :duration

      t.index [:active_job_id, :created_at], name: "index_good_job_executions_on_active_job_id_and_created_at"
      t.index [:process_id, :created_at], name: "index_good_job_executions_on_process_id_and_created_at"
    end

    create_table :good_job_processes, id: :uuid, default: -> { "gen_random_uuid()" } do |t|
      t.datetime :created_at, null: false, default: -> { "now()" }
      t.datetime :updated_at, null: false, default: -> { "now()" }
      t.jsonb :state
      t.integer :lock_type, limit: 2
    end

    create_table :good_job_settings, id: :uuid, default: -> { "gen_random_uuid()" } do |t|
      t.datetime :created_at, null: false, default: -> { "now()" }
      t.datetime :updated_at, null: false, default: -> { "now()" }
      t.text :key
      t.jsonb :value

      t.index :key, name: "good_job_settings_key_idx", unique: true
    end

    create_table :good_jobs, id: :uuid, default: -> { "gen_random_uuid()" } do |t|
      t.text :queue_name
      t.integer :priority
      t.jsonb :serialized_params
      t.datetime :scheduled_at
      t.datetime :performed_at
      t.datetime :finished_at
      t.text :error
      t.datetime :created_at, null: false, default: -> { "now()" }
      t.datetime :updated_at, null: false, default: -> { "now()" }
      t.uuid :active_job_id
      t.text :concurrency_key
      t.text :cron_key
      t.uuid :retried_good_job_id
      t.datetime :cron_at
      t.uuid :batch_id
      t.uuid :batch_callback_id
      t.boolean :is_discrete
      t.integer :executions_count
      t.text :job_class
      t.integer :error_event, limit: 2
      t.text :labels, array: true
      t.uuid :locked_by_id
      t.datetime :locked_at

      t.index [:active_job_id, :created_at], name: "index_good_jobs_on_active_job_id_and_created_at"
      t.index :batch_callback_id, name: "good_jobs_batch_callback_id_idx", where: "(batch_callback_id IS NOT NULL)"
      t.index :batch_id, name: "good_jobs_batch_id_idx", where: "(batch_id IS NOT NULL)"
      t.index [:concurrency_key, :created_at], name: "index_good_jobs_on_concurrency_key_and_created_at"
      t.index :concurrency_key, name: "index_good_jobs_on_concurrency_key_when_unfinished", where: "(finished_at IS NULL)"
      t.index [:cron_key, :created_at], name: "index_good_jobs_on_cron_key_and_created_at_cond", where: "(cron_key IS NOT NULL)"
      t.index [:cron_key, :cron_at], name: "index_good_jobs_on_cron_key_and_cron_at_cond", unique: true, where: "(cron_key IS NOT NULL)"
      t.index :finished_at, name: "index_good_jobs_jobs_on_finished_at", where: "((retried_good_job_id IS NULL) AND (finished_at IS NOT NULL))"
      t.index :labels, name: "index_good_jobs_on_labels", where: "(labels IS NOT NULL)", using: :gin
      t.index :locked_by_id, name: "index_good_jobs_on_locked_by_id", where: "(locked_by_id IS NOT NULL)"
      t.index [:priority, :created_at], name: "index_good_job_jobs_for_candidate_lookup", where: "(finished_at IS NULL)"
      t.index [:priority, :created_at], name: "index_good_jobs_jobs_on_priority_created_at_when_unfinished", order: { priority: "DESC NULLS LAST" }, where: "(finished_at IS NULL)"
      t.index [:priority, :scheduled_at], name: "index_good_jobs_on_priority_scheduled_at_unfinished_unlocked", where: "((finished_at IS NULL) AND (locked_by_id IS NULL))"
      t.index [:queue_name, :scheduled_at], name: "index_good_jobs_on_queue_name_and_scheduled_at", where: "(finished_at IS NULL)"
      t.index :scheduled_at, name: "index_good_jobs_on_scheduled_at", where: "(finished_at IS NULL)"
    end

    # Profiles table (now references users instead of auth.users)
    create_table :profiles, id: :uuid do |t|
      t.text :handle
      t.boolean :approved, default: false
      t.datetime :created_at, null: false, default: -> { "now()" }
    end

    # Steam-related tables
    create_table :steam_categories, id: :integer do |t|
      t.text :description, null: false
    end

    create_table :steam_genres, id: :integer do |t|
      t.text :description, null: false
    end

    create_table :steam_apps, primary_key: :appid, id: :integer do |t|
      t.text :name, null: false
      t.text :kind
      t.uuid :qloo_entity
      t.datetime :created_at, default: -> { "now()" }
      t.datetime :updated_at, default: -> { "now()" }
      t.text :header_image
      t.boolean :is_free
      t.integer :required_age, limit: 2
      t.boolean :coming_soon
      t.date :release_date
      t.boolean :platform_windows
      t.boolean :platform_mac
      t.boolean :platform_linux

      t.index :name, name: "steam_apps_name_trgm", opclass: :gin_trgm_ops, using: :gin
    end

    create_table :steam_app_categories, primary_key: [:appid, :category_id] do |t|
      t.integer :appid, null: false
      t.integer :category_id, null: false
    end

    create_table :steam_app_genres, primary_key: [:appid, :genre_id] do |t|
      t.integer :appid, null: false
      t.integer :genre_id, null: false
    end

    # Search and recommendation tables
    create_table :search_requests, id: :uuid, default: -> { "gen_random_uuid()" } do |t|
      t.uuid :user_id, null: false
      t.integer :seed_entity_ids, default: [], null: false, array: true
      t.jsonb :filters, default: {}, null: false
      t.jsonb :raw_qloo
      t.datetime :created_at, null: false, default: -> { "now()" }
      t.datetime :updated_at, null: false, default: -> { "now()" }
      t.uuid :public_token, default: -> { "gen_random_uuid()" }, null: false
      t.text :search_hash

      t.index :public_token, name: "search_requests_public_token_idx", unique: true
      t.index [:user_id, :created_at], name: "search_requests_user_created_idx", order: { created_at: :desc }
      t.index [:user_id, :search_hash], name: "search_requests_user_search_hash_idx", unique: true
    end

    create_table :recommendations, id: :bigint do |t|
      t.uuid :search_request_id, null: false
      t.integer :appid, null: false
      t.integer :rank, null: false
      t.float :qloo_score
      t.jsonb :raw_qloo
      t.datetime :created_at, null: false, default: -> { "now()" }
      t.datetime :updated_at, null: false, default: -> { "now()" }
      t.jsonb :explainability, default: {}, null: false

      t.index [:search_request_id, :rank], name: "recommendations_request_rank_idx"
      t.index [:search_request_id, :appid], name: "recommendations_search_request_id_appid_key", unique: true
    end

    create_table :recommendation_explanations, id: :bigint do |t|
      t.bigint :recommendation_id, null: false
      t.string :locale, limit: 8, null: false
      t.text :gemini_prompt
      t.text :text
      t.datetime :created_at, null: false, default: -> { "now()" }
      t.datetime :updated_at, null: false, default: -> { "now()" }

      t.index [:recommendation_id, :locale], name: "recommendation_explanations_recommendation_id_locale_key", unique: true
    end

    # User activity tables
    create_table :user_history, primary_key: [:user_id, :appid] do |t|
      t.uuid :user_id, null: false
      t.integer :appid, null: false
      t.datetime :first_seen, default: -> { "now()" }
      t.datetime :last_seen, default: -> { "now()" }
      t.integer :hits, default: 1
    end

    create_table :user_seeds, primary_key: [:user_id, :appid] do |t|
      t.uuid :user_id, null: false
      t.integer :appid, null: false
      t.datetime :added_at, default: -> { "now()" }
      t.integer :hits, default: 1, null: false
      t.datetime :last_seen, default: -> { "now()" }, null: false
    end

    # Foreign key constraints
    add_foreign_key :profiles, :users, column: :id, on_delete: :cascade
    add_foreign_key :recommendation_explanations, :recommendations, on_delete: :cascade
    add_foreign_key :recommendations, :search_requests, on_delete: :cascade
    add_foreign_key :recommendations, :steam_apps, column: :appid, primary_key: :appid, on_delete: :cascade
    add_foreign_key :search_requests, :profiles, column: :user_id, on_delete: :cascade
    add_foreign_key :steam_app_categories, :steam_apps, column: :appid, primary_key: :appid, on_delete: :cascade
    add_foreign_key :steam_app_categories, :steam_categories, column: :category_id, on_delete: :cascade
    add_foreign_key :steam_app_genres, :steam_apps, column: :appid, primary_key: :appid, on_delete: :cascade
    add_foreign_key :steam_app_genres, :steam_genres, column: :genre_id, on_delete: :cascade
    add_foreign_key :user_history, :users, column: :user_id, on_delete: :cascade
    add_foreign_key :user_history, :steam_apps, column: :appid, primary_key: :appid, on_delete: :cascade
    add_foreign_key :user_seeds, :users, column: :user_id, on_delete: :cascade
    add_foreign_key :user_seeds, :steam_apps, column: :appid, primary_key: :appid, on_delete: :cascade
  end
end