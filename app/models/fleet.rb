class Fleet < ActiveRecord::Base

  has_attached_file :image, :styles => { :medium => "300x300>", :thumb => "100x100>" }
  attr_accessible :color, :description, :name, :image

  has_many :monsters

  validates_uniqueness_of :name,:color

  validates_length_of :name, :in => (5..20)
  validates_length_of :description, :in => (10..30)
  validates_format_of :color, :with => /^[a-fA-F0-9]{6}$/

  before_destroy :check_no_monsters_left

  def image_urls
    {
      :thumb => image.url(:thumb), 
      :medium => image.url(:medium), 
      :original => image.url(:original)
    }
  end

  def as_json(options={})
      super(:only => [:color,:name,:description,:id],:methods => :image_urls)
  end

  private

  def check_no_monsters_left
    monsters.size == 0
  end

end
