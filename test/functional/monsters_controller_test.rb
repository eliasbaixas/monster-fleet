require 'test_helper'

class MonstersControllerTest < ActionController::TestCase
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
    assert_difference('Monster.count') do
      post :create, monster: { description: @monster.description, image_content_type: @monster.image_content_type, image_file_name: @monster.image_file_name, image_file_size: @monster.image_file_size, image_updated_at: @monster.image_updated_at, name: @monster.name }
    end

    assert_redirected_to monster_path(assigns(:monster))
  end

  test "should show monster" do
    get :show, id: @monster
    assert_response :success
  end

  test "should get edit" do
    get :edit, id: @monster
    assert_response :success
  end

  test "should update monster" do
    put :update, id: @monster, monster: { description: @monster.description, image_content_type: @monster.image_content_type, image_file_name: @monster.image_file_name, image_file_size: @monster.image_file_size, image_updated_at: @monster.image_updated_at, name: @monster.name }
    assert_redirected_to monster_path(assigns(:monster))
  end

  test "should destroy monster" do
    assert_difference('Monster.count', -1) do
      delete :destroy, id: @monster
    end

    assert_redirected_to monsters_path
  end
end
