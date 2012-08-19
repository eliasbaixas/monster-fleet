// 
// Adapted from Ruby version in http://martin.ankerl.com/2009/12/09/how-to-create-random-colors-programmatically/
//
var golden_ratio_conjugate = 0.618033988749895;
var seed = Math.random();

function my_hex(n){
  return (n.toString(16).length === 1 ? ('0'+n.toString(16)) : n.toString(16));
}

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

  return my_hex(Math.round(r*256)) + my_hex(Math.round(g*256)) + my_hex(Math.round(b*256));
}

function generate_color(){
  seed += golden_ratio_conjugate;
  seed %= 1;
  return hsv_to_rgb(seed, 0.7, 0.95);
}

function nice_palette(){
  var retval="";
  var i;
  for(i=0;i<25;i++){
    retval += '<div style="display:inline-block;width:20px;height:20px;background-color:#'+generate_color()+';></div>';
  }
  return retval + "<br></br>";
}
