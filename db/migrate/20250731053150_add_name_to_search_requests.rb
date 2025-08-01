class AddNameToSearchRequests < ActiveRecord::Migration[8.0]
  def change
    add_column :search_requests, :name, :string, null: false, default: ''
    add_index  :search_requests, :name     
  end
end