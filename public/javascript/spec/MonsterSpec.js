describe("Monster", function() {
  var monster;
  window.fleets=new FleetCollection([new Fleet({id:1}),new Fleet({id:2})]);

  it("should NOT be valid when empty", function() {
    monster = new Monster();
    expect(monster.isValid()).toEqual(false);
  });

  describe('when instantiated with attributes', function() {

    beforeEach(function() {
      monster = new Monster({
        name: 'Main Monster',
              description: 'Main Monster is very dangerous',
              image_url: '/images/thumb/missing.png'
      });
    });

    it('should exhibit attributes', function() {
      expect(monster.get('name')).toEqual('Main Monster');
      expect(monster.get('description')).toEqual('Main Monster is very dangerous');
      expect(monster.get('image_url')).toEqual('/images/thumb/missing.png');
    });

    it('should NOT have a Fleet if no fleet_id is given', function() {
      expect(monster.get('fleet')).toEqual(null);
    })

    it('SHOULD have a Fleet if fleet_id is given and it exists', function() {


      monster = new Monster({
        name: 'Main Monster',
              description: 'Main Monster is very dangerous',
              image_url: '/images/thumb/missing.png',
              fleet_id: 1
      });
      var fl = monster.get('fleet');

      expect(monster.get('fleet')).not.toEqual(null);
    })

  });
});
