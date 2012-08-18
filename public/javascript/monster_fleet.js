window.BasicResource = Backbone.Model.extend({
  validates_presence_of : function(name,attrs){
    if(!attrs[name]){
       return name+" attribute must be present.";
    }
    return false;
  },
  validates_length_of : function(name,attrs,min,max){
    if(min && attrs[name].length < min){
       return name+" must be shorter than " + min + " characters.";
    }
    if(max && attrs[name].length > max){
       return name+" must be longer than " + max + " characters.";
    }
    return false;
  },
  validates_format_of : function(name,attrs,regex){
    if(!attrs[name].match(regex)){
       return name+" is not well-formed (must match "+regex+")"
    }
    return false;
  },
  validates_uniqueness_of : function(name,attrs,collection,getter){
    for(var i in collection){
      if(collection[i] == this)
        continue;
      if(getter(collection[i]).toUpperCase() == attrs[name].toUpperCase())
        return name+" must be unique."
    }
    return false;
  }

});
window.Monster = BasicResource.extend({
  initialize: function(attrs,opts){
    this.fleets = opts.fleets;
    this.on("error", function(model, error) {
      console.log(error);
      return true;
    });
    if(this.fleets.models.length > 0){
      var fl;
      if(this.get('fleet_id')){
        fl = find_fleet(this.fleets, this.get('fleet_id'));
      }else if(this.fleets.models.length > 0){
        fl=this.fleets.models[0];
        this.set('fleet_id',fl.get('id'));
      }
      var myself = this;
      fl.on("change",function(model,err){
        myself.trigger('change');
      })
      this.set('fleet',fl);
    }
  }, 
    validate: function(attrs) {
      var msg = this.validates_presence_of('name',attrs) ||
        this.validates_length_of('name',attrs,5,20) ||
        this.validates_presence_of('description',attrs) ||
        this.validates_length_of('description',attrs,10,30) ||
        this.validates_presence_of('fleet_id',attrs);
      if(msg)
        return msg;
    }
});

window.MonsterCollection = Backbone.Collection.extend({
  model: Monster,
  url: 'monsters',
});

window.Fleet = BasicResource.extend({
  initialize: function(){
    this.on("error", function(model, error) {
      console.log(error);
      return true;
    });
  }, 
  validate: function(attrs) {
    var msg = this.validates_presence_of('name',attrs) ||
  this.validates_length_of('name',attrs,5,20) ||
  this.validates_presence_of('description',attrs) ||
  this.validates_length_of('description',attrs,10,30) ||
  this.validates_presence_of('color',attrs) ||
  this.validates_format_of('color',attrs,/[a-fA-F0-9]{6}/) ||
  this.validates_uniqueness_of('color',attrs,window.fleets.models,function(e){return e.get('color');});
if(msg)
  return msg;
  }
});

window.FleetCollection = Backbone.Collection.extend({
  model: Fleet,
  url: 'fleets',
});

window.MonsterCollection = Backbone.Collection.extend({
  model: Monster,
  url: 'monsters',
});

function find_fleet(fleets, id){
  for(var i in fleets.models)
    if(fleets.models[i].get('id') == id)
      return fleets.models[i];
  return null;
}

window.MyBasicView = Backbone.View.extend({
  destroy_me: function() {
    this.model.destroy();
  },
  change: function(ev){
    if(this.before == $(ev.currentTarget).text())
      return;
    var txt = $(ev.currentTarget).text();
    var which = $(ev.currentTarget).attr('data');
    if(this.model.set(which,txt)){
      this.model.save();
      $(ev.currentTarget).removeClass('has_errors');
    }else{
      $(ev.currentTarget).addClass('has_errors');
    }
  },
  on_focus: function(ev){
    this.before =  $(ev.currentTarget).text();
  },
  change_img : function(ev){
    if($(ev.currentTarget).find('form').length != 0){
      return true;
    }
    var id = parseInt($(ev.currentTarget).attr('data'));
    var templ = _.template($('#file-template').html());
    $(ev.currentTarget).html(templ({id : id, resource : this.resource, resources : this.resources}));
    var myself=this;
    $(ev.currentTarget).find('form').ajaxForm(function(){ myself.model.fetch(); }); 
    $(this.el).trigger("monsters.form_added");
  }
});

window.MonsterView = MyBasicView.extend({
  resource:"monster",
  resources:"monsters",
  initialize: function() {
    this.model.bind('change', this.render, this);
    this.model.bind('destroy', this.remove, this);

    this.fleet_view = new FleetMiniView({model:this.model.get('fleet')});
    function changed_fleet_ev_handler(iid){
      this.model.set('fleet_id',iid);
      this.model.save();
      this.model.set('fleet',find_fleet(this.model.fleets, iid));
      this.fleet_view = new FleetMiniView({model:this.model.get('fleet')});
      this.fleet_view.on('changed_fleet',changed_fleet_ev_handler,this);
      this.render();
    }
    this.fleet_view.on('changed_fleet',changed_fleet_ev_handler,this);
    
    $('#monsters').append(this.render().el);
  },
  template: _.template($('#monster-template').html()),
  tag: 'div',
  className: 'a-monster',
  events: {
    'focus [contentEditable]' : "on_focus",
    'blur [contentEditable]' : "change",
    'click span.destroy' : 'destroy_me',
    'click .monster .imgeditable' : 'change_img'
  },
  render: function() {
    var data = this.model;
    data.fleet_view = this.fleet_view;
    $(this.el).html(this.template(data));
    $(this.el).find('.my_fleet').html(this.fleet_view.render().el);
    return this;
  },
});

window.FleetMiniView = Backbone.View.extend({
  template: _.template($('#fleet-mini-template').html()),
  template_multi: _.template($('#fleet-multi-template').html()),
  initialize: function() {
    this.model.bind('change', this.render, this);
  },
  events: {
    'click div.one_fleet': 'expand',
    'click div.many_fleet' : 'select'
  },
  select: function(ev){
    var iid=parseInt($(ev.currentTarget).attr('data'));
    this.expanded = false;
    this.trigger('changed_fleet', iid);
  },
  expand: function(ev){
    if(this.expanded)
      return;
    this.expanded = true;
    this.render();
    console.log('expanded');
  },
  render: function() {
    if(this.expanded){
      $(this.el).html(this.template_multi(window.fleets));
    }else{
      var data = this.model;
      $(this.el).html(this.template(data));
    }
    this.delegateEvents(this.events);
    return this;
  }
})

window.FleetView = MyBasicView.extend({
  resource:"fleet",
  resources:"fleets",
  template: _.template($('#fleet-template').html()),
  tag: 'ul',
  className: 'a-fleet',
  events: {
    'focus [contentEditable]' : "on_focus",
    'blur [contentEditable]' : "change",
    'click span.destroy': 'destroy_me',
    'click .fleet .imgeditable' : 'change_img'
  },
  initialize: function() {
    this.model.bind('change', this.render, this);
    this.model.bind('destroy', this.remove, this);

    $('#fleets').append(this.render().el);
  },
  destroy_me: function() {
    var myid=this.model.get('id');
    for(var i in window.monsters.models){
      if(window.monsters.models[i].get('fleet_id') == myid)
        return;
    }
    this.model.destroy();
  },
  render: function() {
    var data = this.model;
    $(this.el).html(this.template(data));
    return this;
  }
});
