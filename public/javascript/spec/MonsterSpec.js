describe("BaseModel", function() {
  describe("validates", function() {
    var aModel= new BaseModel({ name : "asdf" });

    it("should validate presence correctly", function() {
      expect(aModel.validates_presence_of('name',aModel.attributes)).toEqual(false);
      expect(aModel.validates_presence_of('something',aModel.attributes)).toEqual('something attribute must be present.');
    });

    it("should validate length correctly", function() {
      expect(aModel.validates_length_of('name',aModel.attributes,3,6)).toEqual(false);
      expect(aModel.validates_length_of('name',aModel.attributes,4,6)).toEqual(false);
      expect(aModel.validates_length_of('name',aModel.attributes,2,4)).toEqual(false);
      expect(aModel.validates_length_of('name',aModel.attributes,5,10)).toEqual('name must be longer than 5 characters.');
      expect(aModel.validates_length_of('name',aModel.attributes,2,3)).toEqual('name must be shorter than 3 characters.');
    });

    it("should validate format correctly", function() {
      expect(aModel.validates_length_of('name',aModel.attributes,/asdf/)).toEqual(false);
      expect(aModel.validates_format_of('name',aModel.attributes,/fdsa/)).toEqual('name is not well-formed (must match /fdsa/).');
    });

    it("should validate uniqueness correctly", function() {
      var col = [{name:"uno"},{name:"dos"}];
      expect(aModel.validates_uniqueness_of('name',aModel.attributes,col,function(i){return i.name;})).toEqual(false);
      col = [{name:"uno"},{name:"asdf"}];
      expect(aModel.validates_uniqueness_of('name',aModel.attributes,col,function(i){return i.name;})).not.toEqual(false);
    });

  });
});

describe("Monster", function() {

  describe('when instantiated with attributes', function() {

    var some_fleets = new FleetCollection([new Fleet({id:1,name:"asdf fdsa"})]);

    beforeEach(function() {
      monster = new Monster({ name: 'Main Monster',
              description: 'Main Monster is very dangerous',
              image_url: '/images/thumb/missing.png'
      },{fleet_collection:some_fleets});
    });

    it('should be valid', function() {
      expect(monster.isValid()).toEqual(true);
    })
    it('should exhibit attributes', function() {
      expect(monster.get('name')).toEqual('Main Monster');
      expect(monster.get('description')).toEqual('Main Monster is very dangerous');
      expect(monster.get('image_url')).toEqual('/images/thumb/missing.png');
    });

    it('should have a Default Fleet (first in collection) if no fleet_id is given', function() {
      expect(monster.get('fleet')).not.toEqual(null);
      expect(monster.get('fleet').get('id')).toEqual(1);
    })

    it('should have a Fleet if fleet_id is given and it exists', function() {
      monster = new Monster({
        name: 'Main Monster',
              description: 'Main Monster is very dangerous',
              image_url: '/images/thumb/missing.png',
              fleet_id: 1
      },{fleet_collection:some_fleets});
      var fl = monster.get('fleet');

      expect(monster.get('fleet')).not.toEqual(null);
    })

    it('should NOT have a Fleet if no fleets in collection', function() {
      monster = new Monster({
        name: 'Main Monster',
              description: 'Main Monster is very dangerous',
              image_url: '/images/thumb/missing.png',
              fleet_id: 1
      },{fleet_collection:{models:[]}});

      expect(monster.get('fleet')).toEqual(null);
    })
  });
});
