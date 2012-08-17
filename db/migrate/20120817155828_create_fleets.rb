class CreateFleets < ActiveRecord::Migration
  def change
    create_table :fleets do |t|
      t.string :name
      t.string :image_file_name
      t.integer :image_file_size
      t.string :image_content_type
      t.datetime :image_updated_at
      t.text :description
      t.string :color

      t.timestamps
    end
  end
end
