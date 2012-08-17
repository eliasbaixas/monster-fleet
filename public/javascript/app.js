$(document).ready(function(){

  $('span.destroy').live('click', function(){
    $(this).trigger('destroy');
  })

  $('[contenteditable]')
  .live('focus', function(){
    $(this).data('before', $(this).text())
  })
.live('blur', function(){
  if($(this).data('before') != $(this).text()){
    $(this).trigger('change');
  }
});

$('.monster .imgeditable')
.live('click', function(){
  if($(this).find('form').length != 0){
    return true;
  }else{
    var id = parseInt($(this).attr('data'));
    var templ = _.template($('#monster-file-template').html());
    $(this).html(templ({id : id}));
    $(this).find('form').ajaxForm(function() {
      for(var i in monsters.models){
        if(monsters.models[i].attributes.id == id){
          monsters.models[i].fetch();
          break;
        }
      }
    }); 
  }
});
$('.fleet .imgeditable')
.live('click', function(){
  if($(this).find('form').length != 0){
    return true;
  }else{
    var id = parseInt($(this).attr('data'));
    var templ = _.template($('#fleet-file-template').html());
    $(this).html(templ({id : id}));
    $(this).find('form').ajaxForm(function() {
      for(var i in fleets.models){
        if(fleets.models[i].attributes.id == id){
          fleets.models[i].fetch();
          break;
        }
      }
    }); 
  }
});



fleets.fetch({
  error: function(e){console.log('error:');console.log(e);},
  success: function(e){
    e.each(function(m){
      new FleetView({model:m});
    });
  }
});

monsters.fetch({
  error: function(e){console.log('error:');console.log(e);},
  success: function(e){
    e.each(function(m){
      new MonsterView({model:m});
    });
  }
});

$('#forms > form').ajaxForm(function() {
  $('#monsters').html('');
  monsters.reset();
  $('#forms > form input, #forms > form textarea').val('');

  monsters.fetch({
    error: function(e){console.log('error:');console.log(e);},
    success: function(e){
      e.each(function(m){
        new MonsterView({model:m});
      });
    }
  });

});
})

function new_monster(){
  var m = new Monster({name : "Cambiame", description : "Descriptción estandard", image_url : "/images/thumb/missing.png"});
  monsters.add(m);
  new MonsterView({model:m});
}
function new_fleet(){
  var m = new Fleet({name : "My Fleet", description : "Some Description", image_url : "/images/thumb/missing.png"});
  fleets.add(m);
  new FleetView({model:m});
}
