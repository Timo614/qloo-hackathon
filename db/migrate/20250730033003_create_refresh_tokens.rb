class CreateRefreshTokens < ActiveRecord::Migration[8.0]
  def change
    create_table :refresh_tokens, id: :uuid, default: -> { "gen_random_uuid()" } do |t|
      t.uuid :user_id, null: false
      t.string :token, null: false
      t.datetime :expires_at, null: false
      t.timestamps

      t.index :user_id
      t.index :token, unique: true
      t.index :expires_at
    end

    add_foreign_key :refresh_tokens, :users, on_delete: :cascade
  end
end
