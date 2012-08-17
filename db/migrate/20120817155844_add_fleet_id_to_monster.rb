class AddFleetIdToMonster < ActiveRecord::Migration
  def change
    add_column :monsters, :fleet_id, :integer
  end
end
