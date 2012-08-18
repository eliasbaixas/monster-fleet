$(document).ready(function(){

  window.monsters = new MonsterCollection();
  window.fleets = new FleetCollection();

  $('#fleets').addClass('spinning');
  fleets.fetch({
    error: function(col,resp){
      console.log('error:');
      console.log(resp);
      $('#fleets').removeClass('spinning');
    },
    success: function(col,resp){
      col.each(function(modl){ var fv=new FleetView({model:modl}); });
      $('#fleets').removeClass('spinning');
      $('#monsters').addClass('spinning');
      fetch_monsters();
    }
  });

  function fetch_monsters(){
    monsters.fetch({
      fleet_collection: window.fleets,
      error: function(col,resp){
        console.log('error:');
        console.log(resp);
      },
      success: function(col){
        col.each(function(modl){
          var fv=new MonsterView({model:modl});
        });
      $('#monsters').removeClass('spinning');
      }
    });
  }
});

function new_monster(){
  var m = new Monster({name : "Cambiame", description : "Descriptción estandard", image_url : "/images/thumb/missing.png"}, {fleet_collection:window.fleets});
  monsters.add(m);
  var mv = new MonsterView({model:m});
}
function new_fleet(){
  var m = new Fleet({name : "My Fleet", description : "Some Description", image_url : "/images/thumb/missing.png", color : generate_color()});
  fleets.add(m);
  var fv = new FleetView({model:m});
}

// 
// Adapted from Ruby version in http://martin.ankerl.com/2009/12/09/how-to-create-random-colors-programmatically/
//
var golden_ratio_conjugate = 0.618033988749895;
var seed = Math.random();

function hsv_to_rgb(h, s, v){
  var h_i = Math.floor(h*6),
      f = h*6 - h_i,
      p = v * (1 - s),
      q = v * (1 - f*s),
      t = v * (1 - (1 - f) * s),
      r,g,b;
  var arri = [[v, t, p],[q, v, p],[p, v, t],[p, q, v],[t, p, v],[v, p, q]][h_i];
  r=arri.shift();
  g=arri.shift();
  b=arri.shift();

  return ""+my_hex(Math.round(r*256))+ my_hex(Math.round(g*256))+ my_hex(Math.round(b*256));
}


function my_hex(n){
  return (n.toString(16).length==1 ? ('0'+n.toString(16)) : n.toString(16));
}
function generate_color(){
    seed += golden_ratio_conjugate;
    seed %= 1;
    return hsv_to_rgb(seed, 0.7, 0.95)
}

function nice_palette(){
  var retval="";

  for(var i=0;i<25;i++){
    retval += '<div style="display:inline-block;width:20px;height:20px;background-color:#'+generate_color()+';></div>';
  }
  return retval + "<br></br>";
}
