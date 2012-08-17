window.Monster = Backbone.Model.extend({
  initialize: function(){
    this.on("error", function(model, error) {
      console.log(error);
      return true;
    });
    var fl = find_fleet(this.get('fleet_id'));
    var self = this;
    fl.on("change",function(model,err){
      self.trigger('change');
    })
    this.set('fleet',fl);
  }, 
validate: function(attrs) {
  if(!attrs.name)
  return "A Name must be given to the monster.";
if(attrs.name.length < 5 || attrs.name.length > 20)
  return "The monsters name must be within 5 and 10 characters long";
if(!attrs.description)
  return "A Description must be given to the monster.";
if(attrs.description.length < 10 || attrs.description.length > 30)
  return "The monsters description must be within 5 and 10 characters long";
}
});

window.MonsterCollection = Backbone.Collection.extend({
  model: Monster,
  url: 'monsters',
});

window.Fleet = Backbone.Model.extend({
  initialize: function(){
    this.on("error", function(model, error) {
      console.log(error);
      return true;
    });
  }, 
validate: function(attrs) {
  if(!attrs.name)
    return "A Name must be given to the monster.";
  if(attrs.name.length < 5 || attrs.name.length > 20)
    return "The monsters name must be within 5 and 10 characters long";
  if(!attrs.description)
    return "A Description must be given to the monster.";
  if(attrs.description.length < 10 || attrs.description.length > 30)
    return "The monsters description must be within 5 and 10 characters long";
  if(!attrs.color || !attrs.color.match(/[a-fA-F0-9]{6}/))
    return "Color must be in HEX";
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

window.monsters = new MonsterCollection();
window.fleets = new FleetCollection();

function find_fleet(id){
  for(var i in window.fleets.models)
    if(window.fleets.models[i].get('id') == id)
      return window.fleets.models[i];
  return null;
}

window.MonsterView = Backbone.View.extend({
  initialize: function() {
    this.model.bind('change', this.render, this);
    this.model.bind('destroy', this.remove, this);

    this.fleet_view = new FleetMiniView({model:this.model.get('fleet')});
    var self=this;
    function changed_fleet_ev_handler(iid){
      console.log("CHANGED FLEET TO:"+iid);
      self.model.set('fleet_id',iid);
      self.model.save();
      self.model.set('fleet',find_fleet(iid));
      self.fleet_view = new FleetMiniView({model:self.model.get('fleet')});
      self.fleet_view.on('changed_fleet',changed_fleet_ev_handler);
      self.render();
    }
    this.fleet_view.on('changed_fleet',changed_fleet_ev_handler)
    
    $('#monsters').append(this.render().el);
  },
  template: _.template($('#monster-template').html()),
  tag: 'ul',
  className: 'a-monster',
  events: {
    'change [contentEditable]': 'change',
  'destroy span.destroy': 'destroy_me'
  },
  destroy_me: function() {
    this.model.destroy();
  },
  render: function() {
    var data = this.model;
    data.fleet_view = this.fleet_view;
    $(this.el).html(this.template(data));
    $(this.el).find('.my_fleet').html(this.fleet_view.render().el);
    return this;
  },

  change: function(ev){
    var txt = $(ev.currentTarget).text();
    var which = $(ev.currentTarget).attr('data');
    if(this.model.set(which,txt)){
      this.model.save();
      $(ev.currentTarget).removeClass('has_errors');
    }else{
      $(ev.currentTarget).addClass('has_errors');
    }
  }
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

window.FleetView = Backbone.View.extend({
  template: _.template($('#fleet-template').html()),
  tag: 'ul',
  className: 'a-fleet',
  events: {
    'change [contentEditable]': 'change',
  'destroy span.destroy': 'destroy_me'
  },

  initialize: function() {
    this.model.bind('change', this.render, this);
    this.model.bind('destroy', this.remove, this);

    $('#fleets').append(this.render().el);
  },

  destroy_me: function() {
    this.model.destroy();
  },
  render: function() {
    var data = this.model;
    $(this.el).html(this.template(data));
    return this;
  },

  change: function(ev){
    var txt = $(ev.currentTarget).text();
    var which = $(ev.currentTarget).attr('data');
    if(this.model.set(which,txt)){
      this.model.save();
      $(ev.currentTarget).removeClass('has_errors');
    }else{
      $(ev.currentTarget).addClass('has_errors');
    }
  }
});
