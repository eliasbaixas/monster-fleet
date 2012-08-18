$(document).ready(function(){

  window.monsters = new MonsterCollection();
  window.fleets = new FleetCollection();

  fleets.fetch({
    error: function(col,resp){
      console.log('error:');
      console.log(resp);
    },
    success: function(col,resp){
      col.each(function(modl){ var fv=new FleetView({model:modl}); });
      fetch_monsters();
    }
  });

  function fetch_monsters(){
    monsters.fetch({
      fleets: window.fleets,
      error: function(col,resp){
        console.log('error:');
        console.log(resp);
      },
      success: function(col){
        col.each(function(modl){
          var fv=new MonsterView({model:modl});
        });
      }
    });
  }
});

function new_monster(){
  var m = new Monster({name : "Cambiame", description : "Descriptción estandard", image_url : "/images/thumb/missing.png"}, {fleets:window.fleets});
  monsters.add(m);
  var mv = new MonsterView({model:m});
}
function new_fleet(){
  var m = new Fleet({name : "My Fleet", description : "Some Description", image_url : "/images/thumb/missing.png", color : "FFFFFF"});
  fleets.add(m);
  var fv = new FleetView({model:m});
}
