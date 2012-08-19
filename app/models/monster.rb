class Monster < ActiveRecord::Base
  has_attached_file :image, :styles => { :medium => "300x300>", :thumb => "100x100>" }
  attr_accessible :description, :name, :image, :fleet_id

  validates_uniqueness_of :name

  validates_length_of :name, :in => (5..20)
  validates_length_of :description, :in => (10..30)
  validates_presence_of :fleet_id
  validates_presence_of :fleet, :message => "does longer not exist"

  belongs_to :fleet

  def image_urls
    {
      :thumb => image.url(:thumb), 
      :medium => image.url(:medium), 
      :original => image.url(:original)
    }
  end

  def as_json(options={})
      super(:only => [:fleet_id,:name,:description,:id],:methods => :image_urls)
  end

end
