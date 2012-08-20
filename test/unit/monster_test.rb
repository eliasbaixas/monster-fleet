require 'test_helper'

class MonsterTest < ActiveSupport::TestCase

  test "new valid Monster" do
    attributes = {
      :name => "12345",
      :description => "123456789A",
      :fleet_id => fleets(:one).id
    }
    @monster = Monster.new(attributes.merge(:image => sample_file));
    @monster.save

    assert @monster.valid?
  end

  test "no inconsistent monster" do
    attributes = {
      :name => "12345",
      :description => "123456789A"
    }
    @monster = Monster.new(attributes.merge(:image => sample_file));
    @monster.save

    assert !@monster.valid?
  end
  
end
