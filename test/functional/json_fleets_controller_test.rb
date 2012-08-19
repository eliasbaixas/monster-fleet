require 'test_helper'

class FleetsControllerTest < ActionController::TestCase

  setup do
    @fleet = fleets(:one)
  end

  test "should get JSON index" do
    get :index, :format => :json
    assert_response :success
    assert_not_nil assigns(:fleets)
  end

  test "should create JSON fleet" do
    assert_difference('Fleet.count') do
      post :create, :fleet=> { :color=> "345687", :description=> "012345678A", :name=> "12345678"}, :format => :json
    end

    assert_response :success
    assert_not_nil assigns(:fleet)
  end

  test "should show JSON fleet" do
    get :show, :id=> @fleet, :format => :json
    assert_response :success
  end

  test "should update JSON fleet" do
    put :update, :id=> @fleet, :fleet=> { :color=> "123456", :description=> @fleet.description, :name=> "Asere je ja" }, :format => :json

    assert_response :success
    assert_not_nil assigns(:fleet)
  end

  test "should destroy JSON fleet" do

    @empty_fleet = fleets(:empty_fleet)

    assert_difference('Fleet.count', -1) do
      delete :destroy, :id=> @empty_fleet, :format => :json
    end
    assert_response :success

    assert_difference('Fleet.count', 0) do
      delete :destroy, :id=> @fleet, :format => :json
    end
    assert_response 422

  end
end
