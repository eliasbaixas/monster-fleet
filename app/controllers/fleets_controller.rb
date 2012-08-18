class FleetsController < ApplicationController

  def webcam
    @fleet = Fleet.find(params[:id])

    fname = File.join(Rails.root,'public','uploads',"#{SecureRandom.hex}.jpg");
    File.open(fname, 'w') do |f|
      f.write request.raw_post.force_encoding("UTF-8")
    end
    @fleet.image = File.new(fname)
    @fleet.save
    File.unlink(fname)
    render :text => params[:id]
  end

  def index
    @fleets = Fleet.all

    respond_to do |format|
      format.html # index.html.erb
      format.json { render json: @fleets }
    end
  end

  def show
    @fleet = Fleet.find(params[:id])

    respond_to do |format|
      format.html # show.html.erb
      format.json { render json: @fleet }
    end
  end

  def new
    @fleet = Fleet.new

    respond_to do |format|
      format.html # new.html.erb
      format.json { render json: @fleet }
    end
  end

  def edit
    @fleet = Fleet.find(params[:id])
  end

  def create
    @fleet = Fleet.new(params[:fleet])

    respond_to do |format|
      if @fleet.save
        format.html { redirect_to @fleet, notice: 'Fleet was successfully created.' }
        format.json { render json: @fleet, status: :created, location: @fleet }
      else
        format.html { render action: "new" }
        format.json { render json: @fleet.errors, status: :unprocessable_entity }
      end
    end
  end

  def update
    @fleet = Fleet.find(params[:id])

    respond_to do |format|
      if @fleet.update_attributes(params[:fleet])
        format.html { redirect_to @fleet, notice: 'Fleet was successfully updated.' }
        format.json { head :no_content }
      else
        format.html { render action: "edit" }
        format.json { render json: @fleet.errors, status: :unprocessable_entity }
      end
    end
  end

  def destroy
    @fleet = Fleet.find(params[:id])

    respond_to do |format|
      if @fleet.destroy
        format.html { redirect_to fleets_url }
        format.json { head :no_content }
      else
        format.html { render action: "show" }
        format.json { render json: @fleet.errors, status: :unprocessable_entity }
      end
    end
  end
end
