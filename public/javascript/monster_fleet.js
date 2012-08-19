function find_fleet(fleets, id){
  var i;
  for(i=0;i< fleets.models.length;i++){
    if(fleets.models[i].get('id') === id){
      return fleets.models[i];
    }
  }
  return null;
}


window.BaseModel = Backbone.Model.extend({
  validates_presence_of : function(name,attrs){
    var retval = {};
    if(!attrs[name]){
      retval[name] = " must be present.";
      return retval;
    }
    return false;
  },
validates_length_of : function(name,attrs,min,max){
  var retval = {};
  if(min && attrs[name].length < min){
    retval[name] = " must be longer than " + min + " characters.";
    return retval;
  }
  if(max && attrs[name].length > max){
    retval[name] = " must be shorter than " + max + " characters.";
    return retval;
  }
  return false;
},
  validates_format_of : function(name,attrs,regex){
    var retval = {};
    if(!attrs[name].match(regex)){
      retval[name] = " is not well-formed (must match "+regex+").";
      return retval;
    }
    return false;
  },
  validates_uniqueness_of : function(name,attrs,collection,getter){
    var i,retval={};
    for(i in collection){
      if(collection[i] !== this){
        if(getter(collection[i]).toUpperCase() === attrs[name].toUpperCase()){
          retval[name] = " must be unique.";
          return retval;
        }
      }
    }
    return false;
  }
});

window.Monster = BaseModel.extend({
  initialize: function(attrs,opts){
    this.fleet_collection = opts.fleet_collection;

    if(this.fleet_collection.models.length === 0){
      return;
    }
    var my_fleet;
    if(this.get('fleet_id')){
      my_fleet = find_fleet(this.fleet_collection, this.get('fleet_id'));
    } else if(this.fleet_collection.models.length > 0){
      my_fleet=this.fleet_collection.models[0];
      this.set('fleet_id',my_fleet.get('id'));
    }
    var myself = this;
    if(my_fleet){
      my_fleet.on("change",function(model,err){
        myself.trigger('change');
      });
    }
    this.set('fleet',my_fleet);
  }, 
    validate: function(attrs) {
      if(!window.do_client_validations){
        return ;
      }
      var msg = this.validates_presence_of('name',attrs) ||
        this.validates_length_of('name',attrs,5,20) ||
        this.validates_presence_of('description',attrs) ||
        this.validates_length_of('description',attrs,10,30) ||
        this.validates_presence_of('fleet_id',attrs);
      if(msg){
        return msg;
      }
    }
});

window.MonsterCollection = Backbone.Collection.extend({
  model: Monster,
  url: 'monsters'
});

window.Fleet = BaseModel.extend({
  initialize: function(attrs,opts){
    this.on("error", function(model, error) {
      if(console){
        console.log(error);
      }
      return true;
    });
  }, 
  validate: function(attrs) {
    if(!window.do_client_validations){
      return;
    }
    var msg = this.validates_presence_of('name',attrs) ||
  this.validates_length_of('name',attrs,5,20) ||
  this.validates_presence_of('description',attrs) ||
  this.validates_length_of('description',attrs,10,30) ||
  this.validates_presence_of('color',attrs) ||
  this.validates_format_of('color',attrs,/[a-fA-F0-9]{6}/) ||
  this.validates_uniqueness_of('color',attrs,this.collection.models,function(e){return e.get('color');});

  if(msg){
    return msg;
  }
  }
});

window.FleetCollection = Backbone.Collection.extend({
  model: Fleet,
  url: 'fleets'
});

window.MonsterCollection = Backbone.Collection.extend({
  model: Monster,
  url: 'monsters'
});

window.BaseView = Backbone.View.extend({
  is_valid_class : function(){ return this.model.isValid() ? '' : 'has_errors'; },
  is_new_class : function(){ return this.model.isNew() ? "is_new" : "";},
  is_editable_class : function(){ return (this.is_editable ? "is_editable" : ""); },
  content_editable_text : function(){ return (this.is_editable ? "[finish]" : "[edit]"); },
  content_editable_helper : function(){ return (this.is_editable ? " contentEditable='true' " : ""); },
  is_editable : false,
  current_view : "medium",
  navigate_to_model : function(){ },
  image_url : function(){
    return this.model.get('image_urls')[this.current_view];
  },
  handle_error : function(model,errors){
    var nam;
    for(nam in errors){
      if(errors.hasOwnProperty(nam)){
        var ele = $(this.el).find('.'+nam+'.editable-holder');
        ele.addClass('client_errors');
        ele.find('.client_error').remove();
        ele.append('<div class="client_error">'+nam+' '+errors[nam]+'</div>');
      }
    }
  },
  do_snapshot : function(event) {
    var myself=this;
    var the_elem=$(event.currentTarget).closest('.imgeditable');
    the_elem.addClass('spinning');
    var url = '/' + this.resources + '/' + this.model.get('id') + '/webcam?' + window.csrf_param + '=' + encodeURI(window.csrf_token);
    webcam.snap(url,function(msg){
      return myself.upload_complete(msg,the_elem);
    });
  }, 
  upload_complete : function(msg,el) {
    window.webcam.reset();
    this.model.fetch()
    el.removeClass('spinning');
  },
  toggle_editable: function(ev) {
    this.is_editable = !this.is_editable;
    $(this.el).trigger('editable_changed',this.is_editable);
  },
  destroy_me: function() {
    var myself = this;
    $(this.el).addClass('spinning');
    this.model.destroy({
      wait : true,
      success : function(model,resp){
        $(myself.el).removeClass('spinning');
      },
      error : function(model,resp){
        $(myself.el).removeClass('spinning');
      }
    });
  },
  change: function(ev){
    if(this.before === $(ev.currentTarget).text()){
      return;
    }
    var myself=this;
    var txt = $(ev.currentTarget).text();
    var which = $(ev.currentTarget).attr('data');
    if(this.model.set(which,txt)){
      var xhr=this.model.save(null,{wait:true,
        success:function(model,resp){
          if(console){
            console.log("Change "+which+" from '"+myself.before+"' to '"+txt+"'");
          }
          $(myself.el).find('.'+which+'.editable-holder .server_error').remove();
          $(myself.el).find('.'+which+'.editable-holder .client_error').remove();
        },
        error:function(model,resp){
          var json = JSON.parse(resp.responseText);
          var ele, nam;
          $(ev.currentTarget).html(myself.before);
          for(nam in json){
            if(json.hasOwnProperty(nam)){
              if(nam == 'base'){
                $(myself.el).append('<div class="server_error">'+json[nam]+'</div>');
              }else{
                ele = $(myself.el).find('.'+nam+'.editable-holder');
                ele.addClass('server_errors');
                ele.find('.server_error').remove();
                ele.append('<div class="server_error">'+nam+' '+json[nam]+'</div>');
              }
            }
          }
        }
      });
      if(xhr){
        $(ev.currentTarget).removeClass('has_errors');
      }
    }else{
      $(ev.currentTarget).addClass('has_errors');
    }
  },
  on_focus: function(ev){
    this.before =  $(ev.currentTarget).text();
  },
  change_img : function(ev){
    if(!this.is_editable || $(ev.currentTarget).find('form').length !== 0 || this.model.isNew()){
      return true;
    }
    var id = parseInt($(ev.currentTarget).attr('data'),10);
    var templ = _.template($('#file-template').html());
    $(ev.currentTarget).html(templ({id : id, resource : this.resource, resources : this.resources}));
    var myself=this;
    var myedit=$(this.el).find('.imgeditable');
    $(ev.currentTarget).find('form').ajaxForm({
      success : function(){
        myedit.removeClass('spinning');
        myself.model.fetch({
          error:function(model,resp){
            if(console){
              console.log("error:");
              console.log(resp);
            }
          }
        });
      },
      error : function(ev){
        myedit.removeClass('spinning');
        if(console){
          console.log(ev);
        }
      },
      beforeSerialize: function($form, options) { 
        myedit.addClass('spinning');
      }
    }); 
    $(this.el).find('.webcam_holder').html(webcam.get_html(240, 180));
  }
});

window.MonsterView = BaseView.extend({
  resource:"monster",
  resources:"monsters",
  initialize: function(attrs) {
    this.model.bind('change', this.render, this);
    this.model.bind('destroy', this.remove, this);
    this.model.bind('error', this.handle_error, this);

    this.fleet_view = new FleetMiniView({model:this.model.get('fleet')});

    if(this.model.isNew()){
      this.is_editable = true
      this.fleet_view.is_editable=true;
    }

    var myself=this;
    function changed_fleet_ev_handler(iid){
      this.model.set('fleet_id',iid);
      var xhr=this.model.save(null,{
        wait : true ,
          success: function(model,resp){
            model.set('fleet',find_fleet(model.fleet_collection, iid));
            myself.fleet_view = new FleetMiniView({model:model.get('fleet')});
            myself.fleet_view.is_editable = myself.is_editable;
            myself.fleet_view.on('changed_fleet',changed_fleet_ev_handler,myself);
            myself.render();
          },
          error:function(model,resp){
            var json = JSON.parse(resp.responseText);
            var nam;
            for(nam in json){
              if(json.hasOwnProperty(nam)){
                var ele = $(myself.el).find('.'+nam+'.editable-holder');
                ele.addClass('server_errors');
                ele.find('.server_error').remove();
                ele.append('<div class="server_error">'+nam+' '+json[nam]+'</div>');
              }
            }
          }
      });
    }
    this.fleet_view.on('changed_fleet',changed_fleet_ev_handler,this);

    $(attrs.holder).append(this.render().el);
  },
  editable_changed_handler : function(ev,is_editable){
    if(this.fleet_view){
      this.fleet_view.is_editable = is_editable;
    }
    this.render();
  },
  template: _.template($('#monster-template').html()),
  tag: 'div',
  className: 'a-monster',
  events: {
    'editable_changed' : "editable_changed_handler",
    'focus [contentEditable]' : "on_focus",
    'blur [contentEditable]' : "change",
    'click .shoot' : 'do_snapshot',
    'click .name' : 'navigate_to_model',
    'click span.destroy' : 'destroy_me',
    'click span.make-editable' : 'toggle_editable',
    'click .monster .imgeditable' : 'change_img'
  },
  render: function() {
    $(this.el).html(this.template(this));
    $(this.el).find('.my_fleet').html(this.fleet_view.render().el);
    return this;
  }
});

window.FleetMiniView = Backbone.View.extend({
  image_url : function(model){
    return (model||this.model).get('image_urls')['thumb'];
  },
  template: _.template($('#fleet-mini-template').html()),
  template_multi: _.template($('#fleet-multi-template').html()),
  initialize: function() {
    if(this.model){
      this.model.bind('change', this.render, this);
    }
  },
  events: {
    'click div.one_fleet': 'expand_handler',
  'click div.many_fleet' : 'select_handler'
  },
  select_handler: function(ev){
    var iid=parseInt($(ev.currentTarget).attr('data'),10);
    this.expanded = false;
    this.trigger('changed_fleet', iid);
  },
  expand_handler: function(ev){
    if(!this.is_editable || this.expanded){
      return;
    }
    this.expanded = true;
    this.render();
  },
  render: function() {
    if(this.expanded){
      $(this.el).html(this.template_multi(this));
    }else{
      $(this.el).html(this.template(this));
    }
    this.delegateEvents(this.events);
    return this;
  }
});

window.FleetView = BaseView.extend({
  resource:"fleet",
  resources:"fleets",
  template: _.template($('#fleet-template').html()),
  tag: 'ul',
  className: 'a-fleet',
  events: {
    'editable_changed' : "render",
  'focus [contentEditable]' : "on_focus",
  'blur [contentEditable]' : "change",
  'click .shoot' : 'do_snapshot',
  'click .name' : 'navigate_to_model',
  'click span.destroy': 'destroy_me',
  'click span.make-editable' : 'toggle_editable',
  'click .fleet .imgeditable' : 'change_img'
  },
  initialize: function(attrs) {
    this.model.bind('change', this.render, this);
    this.model.bind('destroy', this.remove, this);
    this.model.bind('error', this.handle_error, this);

    if(this.model.isNew()){
      this.is_editable = true
    }

    $(attrs.holder).append(this.render().el);
  },
  destroy_me: function() {
    var myself=this;
    $(this.el).addClass('spinning');
    this.model.destroy({
      wait : true,
      success : function(model,resp){
        $(myself.el).removeClass('spinning');
      },
      error : function(model,resp){
        $(myself.el).append('<div class="server_errors">'+resp.responseText+'</div>');
        $(myself.el).removeClass('spinning');
      }
    });
  },
  render: function() {
    $(this.el).html(this.template(this));
    return this;
  }
});

window.BigView = Backbone.View.extend({
  el : "#multi_view",
  render:function(){
    $(this.el).html(this.template());
  },
  fetch_fleets : function(){
    var myself=this;
    this.fleets.fetch({
      fleet_collection: this.fleets,
      error: function(col,resp){
        console.log('error:');
        console.log(resp);
      },
      success: function(col,resp){
        myself.trigger('fleets_loaded',col);
      }
    });
  },
  fetch_monsters:function(){
    var myself=this;
    this.monsters.fetch({
      fleet_collection: this.fleets,
      error: function(col,resp){
        console.log('error:');
        console.log(resp);
      },
      success: function(col){
        myself.trigger('monsters_loaded',col);
      }
    });
  }
});

window.AllView = BigView.extend({
  el : "#multi_view",
  template: _.template($('#all-template').html()),
  initialize : function(){
    var myself=this;
    this.monsters = new MonsterCollection();
    this.fleets = new FleetCollection();
    this.render();
    this.on('fleets_loaded',function(col){
      col.each(function(modl){
        var fv=new FleetView({model:modl, holder : $(myself.el).find('.fleets')});
      });
      myself.fetch_monsters();
    });
    this.on('monsters_loaded',function(col){
      col.each(function(modl){
        var fv=new MonsterView({model:modl, holder : $(myself.el).find('.monsters')});
      })
    });
    this.fetch_fleets();
  },
  events : {
    'click a.new-monster' : "new_monster",
    'click a.new-fleet' : "new_fleet"
  },
  render:function(){
    $(this.el).html(this.template());
  },
  default_images : {
    thumb : "/images/thumb/missing.png" ,
    medium : "/images/thumb/missing.png" ,
    original : "/images/thumb/missing.png"
  },
  new_monster : function(){
    var m = new Monster({name : "Change me", description : "Some Description", image_urls : this.default_images}, {fleet_collection:this.fleets});
    this.monsters.add(m);
    var mv = new MonsterView({model:m, is_editable : true, holder : $(myself.el).find('.monsters')});
  },
  new_fleet : function(){
    var m = new Fleet({name : "Change me", description : "Some Description", image_urls : this.default_images, color : generate_color()});
    this.fleets.add(m);
    var fv = new FleetView({model:m, is_editable : true, holder : $(this.el).find('.fleets')});
  }
});

var MonstersApp = Backbone.Router.extend({
  routes: {
    "": "all",  // #all
    "monsters/:id": "monsters",  // #monsters/7
    "fleets/:id":   "fleets"   // #fleets/8
  },
  all: function() {
    this.main_view = new AllView();
  },
  monsters: function(id) {
  },
  fleets: function(id) {
  }
});
