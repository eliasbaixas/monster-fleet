require 'test_helper'

class MonstersControllerTest < ActionController::TestCase
  fixtures :all

  setup do
    @monster = monsters(:one)
  end

  test "should get JSON index" do
    get :index, :format => :json
    assert_response :success
    assert_not_nil assigns(:monsters)
  end

  test "should create JSON monster" do
    assert_difference('Monster.count') do
      post :create, :monster => { :description=> "0123456789A", :name=> "12345678", :fleet_id => fleets(:one).id },
        :html => { :multipart => true }, :format => :json
    end

    assert_response :success
    assert_not_nil assigns(:monster)
  end

  test "should show JSON monster" do
    get :show, :id => @monster, :format => :json
    assert_response :success
  end

  test "should update JSON monster" do
    put :update, :id=> @monster,
      :monster=> { :description=> "My New Description", :name=> "Some old" },
      :html => { :multipart => true }, :format => :json
    assert_response :success
    assert_not_nil assigns(:monster)
  end

end
