class MonstersController < ApplicationController

  def app
    @monster = Monster.new
  end

  def index
    @monsters = Monster.all

    respond_to do |format|
      format.html # index.html.erb
      format.json { render json: @monsters }
    end
  end

  def show
    @monster = Monster.find(params[:id])

    respond_to do |format|
      format.html # show.html.erb
      format.json { render json: @monster }
    end
  end

  def new
    @monster = Monster.new

    respond_to do |format|
      format.html # new.html.erb
      format.json { render json: @monster }
    end
  end

  def edit
    @monster = Monster.find(params[:id])
  end

  def create
    @monster = Monster.new(params[:monster])

    respond_to do |format|
      if @monster.save
        format.html { redirect_to @monster, notice: 'Monster was successfully created.' }
        format.json { render json: @monster, status: :created, location: @monster }
      else
        format.html { render action: "new" }
        format.json { render json: @monster.errors, status: :unprocessable_entity }
      end
    end
  end

  def update
    @monster = Monster.find(params[:id])

    respond_to do |format|
      if @monster.update_attributes(params[:monster])
        format.html { redirect_to @monster, notice: 'Monster was successfully updated.' }
        format.json { head :no_content }
      else
        format.html { render action: "edit" }
        format.json { render json: @monster.errors, status: :unprocessable_entity }
      end
    end
  end

  def destroy
    @monster = Monster.find(params[:id])
    @monster.destroy

    respond_to do |format|
      format.html { redirect_to monsters_url }
      format.json { head :no_content }
    end
  end
end
