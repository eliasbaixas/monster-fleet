class MonstersController < ApplicationController

  def app
  end

  def webcam
    @monster = Monster.find(params[:id])

    fname = File.join(Rails.root,'public','uploads',"#{SecureRandom.hex}.jpg");
    File.open(fname, 'w') do |f|
      f.write request.raw_post.force_encoding("UTF-8")
    end
    @monster.image = File.new(fname)
    @monster.save
    File.unlink(fname)
    render :text => params[:id]
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
    @monster = Monster.where(:id => params[:id]).first

    respond_to do |format|
      if ! @monster
        format.html { redirect_to monsters_url, :notice=> 'Monster does not exist.' }
        format.json { render :json => {:base => "Monster does not exist! (someone might have deleted it)"} , :status => :unprocessable_entity }
      else
        if @monster.update_attributes(params[:monster])
          format.html { redirect_to @monster, notice: 'Monster was successfully updated.' }
          format.json { head :no_content }
        else
          format.html { render action: "edit" }
          format.json { render json: @monster.errors, status: :unprocessable_entity }
        end
      end
    end
  end

  def destroy
    if @monster = Monster.where(:id => params[:id]).first
      @monster.destroy
    end

    respond_to do |format|
      format.html { redirect_to monsters_url }
      format.json { head :no_content }
    end
  end

  private

  def upload_path(id) # is used in upload and create
    file_name = session[:session_id].to_s + '.jpg'
    File.join(Rails.root, 'public', 'uploads', file_name)
  end

end
