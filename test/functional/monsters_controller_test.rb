require 'test_helper'

class MonstersControllerTest < ActionController::TestCase
  fixtures :all

  setup do
    @monster = monsters(:one)
  end

  test "should get index" do
    get :index
    assert_response :success
    assert_not_nil assigns(:monsters)
  end

  test "should get new" do
    get :new
    assert_response :success
  end

  test "should create monster" do
    f = fixture_file_upload('MARCELVILLIER71.jpg','image/jpeg')
    assert_difference('Monster.count') do
      post :create, :monster => { :description=> "0123456789A", :name=> "12345678", :image => f, :fleet_id => fleets(:one).id },
        :html => { :multipart => true }
    end

    assert_redirected_to monster_path(assigns(:monster))
  end

  test "should show monster" do
    get :show, :id => @monster
    assert_response :success
  end

  test "should get edit" do
    get :edit, :id=> @monster
    assert_response :success
  end

  test "should update monster" do
    f = fixture_file_upload('MARCELVILLIER71.jpg','image/jpeg')
    put :update, :id=> @monster,
      :monster=> { :description=> "My New Description", :name=> "Some old", :image => f },
      :html => { :multipart => true }
    assert_redirected_to monster_path(assigns(:monster))
  end

  test "should destroy monster" do
    assert_difference('Monster.count', -1) do
      delete :destroy, :id => @monster
    end

    assert_redirected_to monsters_path
  end
end
