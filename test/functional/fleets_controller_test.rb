require 'test_helper'

class FleetsControllerTest < ActionController::TestCase
  setup do
    @fleet = fleets(:one)
  end

  test "should get index" do
    get :index
    assert_response :success
    assert_not_nil assigns(:fleets)
  end

  test "should get new" do
    get :new
    assert_response :success
  end

  test "should create fleet" do
    f = fixture_file_upload('MARCELVILLIER71.jpg','image/jpeg')
    assert_difference('Fleet.count') do
      post :create, :fleet=> { :color=> "345687", :description=> "012345678A", :name=> "12345678", :image => f }
    end

    assert_redirected_to fleet_path(assigns(:fleet))
  end

  test "should show fleet" do
    get :show, :id=> @fleet
    assert_response :success
  end

  test "should get edit" do
    get :edit, :id=> @fleet
    assert_response :success
  end

  test "should update fleet" do
    f = fixture_file_upload('MARCELVILLIER71.jpg','image/jpeg')
    put :update, :id=> @fleet, :fleet=> { :color=> "123456", :description=> @fleet.description, :name=> "Asere je ja", :image => f }
    assert_redirected_to fleet_path(assigns(:fleet))
  end

  test "should destroy fleet" do

    @fleet_two = fleets(:two)

    assert_difference('Fleet.count', -1) do
      delete :destroy, :id=> @fleet_two
    end
    assert_redirected_to fleets_path

    assert_difference('Fleet.count', 0) do
      delete :destroy, :id=> @fleet
    end

  end
end
