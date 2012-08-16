class Monster < ActiveRecord::Base
  has_attached_file :image, :styles => { :medium => "300x300>", :thumb => "100x100>" }
  attr_accessible :description, :name, :image

  def image_url
    image.url(:thumb)
  end

  def as_json(options={})
      super(:only => [:name,:description,:id],:methods => :image_url)
  end

end
