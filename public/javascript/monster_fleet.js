/**
 * BaseModel for our app.
 * Implements advanced error handling
 *  * at least, more fine-grained than Backbone's default
 *  * similar to Rails ActiveRecord#errors
 * If model is in inconsistent state (cannot be saved), then changes are stored in "pending_changes"
 * then, validations are performed on those "pending_changes" instead of the inconsistent values.
 * When model is successfully saved, pending_changes are reset.
 */
window.BaseModel = Backbone.Model.extend({
  errors : {} ,
pending_changes : {},
errors_for : function(name){
  if(!this.errors[name]){
    this.errors[name]=[];
  }
  return this.errors[name];
},
validates_presence_of : function(name,attrs){
  var v = this.pending_changes[name] || attrs[name];
  if(!v){
    this.errors_for(name).push(" must be present");
    return false;
  }
  return true;
},
validates_length_of : function(name,attrs,min,max){
  var v = this.pending_changes[name] || attrs[name];
  if(min && v.length < min){
    this.errors_for(name).push(" must be longer than " + min + " characters (it is "+v.length+")");
    return false;
  }
  if(max && v.length > max){
    this.errors_for(name).push(" must be shorter than " + max + " characters (it is "+v.length+")");
    return false;
  }
  return true;
},
  validates_format_of : function(name,attrs,regex){
    var v = this.pending_changes[name] || attrs[name];
    if(!v.match(regex)){
      this.errors_for(name).push(" is not well-formed (must match "+regex+")");
      return false;
    }
    return true;
  },
  validates_uniqueness_of : function(name,attrs,collection,getter){
    var v = this.pending_changes[name] || attrs[name];
    var i,retval={};
    for(i in collection){
      if(collection[i] !== this){
        if(getter(collection[i]).toUpperCase() === v.toUpperCase()){
          this.errors_for(name).push(" must be unique");
          return false;
        }
      }
    }
    return true;
  }
});

/**
 * Monster model for our app.
 * has a name, description, belongs to fleet (so fleet_id), has an image.
 * Needs a reference to the fleet collection, so that when in "edit mode"
 * we can show the Fleets available.
 * Needs a reference to the Fleet to which it belongs (so that it can bind
 * 'change' on the Fleet and dispatch a 'change' itself).
 */
window.Monster = BaseModel.extend({
  initialize: function(attrs,opts){
    this.fleet_collection = opts.fleet_collection;
    if(this.fleet_collection.models.length !== 0){
      this.setup_fleet();
    }
  }, 
  /** Finds and returns a fleet by id, given a fleets collection */
  find_fleet : function(id){
    var i;
    for(i=0;i< this.fleet_collection.models.length;i++){
      if(this.fleet_collection.models[i].get('id') === id){
        return this.fleet_collection.models[i];
      }
    }
    return null;
  }, 
  /** Setting up the fleet : either find it by fleet_id, or set the first fleet available, or null */
  setup_fleet : function(){
    var my_fleet;
    if(this.get('fleet_id')){
      my_fleet = this.find_fleet(this.get('fleet_id'));
    } else if(this.fleet_collection.models.length > 0){
      my_fleet=this.fleet_collection.models[0];
      this.set('fleet_id',my_fleet.get('id'));
    }
    if(my_fleet){
      my_fleet.on("change",function(model,err){
        this.trigger('change');
      },this);
    }
    this.set('fleet',my_fleet);

  },
  validate: function(attrs) {
    if(!window.router.do_client_validations){
      return ;
    }
    this.errors = {};
    this.validates_presence_of('name',attrs);
    this.validates_length_of('name',attrs,5,20);
    this.validates_presence_of('description',attrs);
    this.validates_length_of('description',attrs,10,30);
    this.validates_presence_of('fleet_id',attrs);

    return !$.isEmptyObject(this.errors);
  }
});

/**
 * Fleet model for our app.
 * has a name, description, color, has an image.
 */
window.Fleet = BaseModel.extend({
  validate: function(attrs) {
    if(!window.router.do_client_validations){
      return;
    }
    this.errors = {};
    this.validates_presence_of('name',attrs);
    this.validates_length_of('name',attrs,5,20);
    this.validates_presence_of('description',attrs);
    this.validates_length_of('description',attrs,10,30);
    this.validates_presence_of('color',attrs);
    this.validates_format_of('color',attrs,/[a-fA-F0-9]{6}/);
    this.validates_uniqueness_of('color',attrs,this.collection.models,function(e){return e.get('color');});

    return !$.isEmptyObject(this.errors);
  }
});

/** 
 * A collection of Fleets
 */
window.FleetCollection = Backbone.Collection.extend({
  model: Fleet,
  url: 'fleets'
});

/** 
 * A collection of Fleets
 */
window.MonsterCollection = Backbone.Collection.extend({
  model: Monster,
  url: 'monsters'
});

/** 
 * A Base class for all our views.
 * Plays well with our BaseModel's errors and validations.
 * Has some helpers for displaying errors in template.
 * Implements logic for handling webcam snapshots (uploading etc.).
 * Implements logic for uploading images with AJAX (jquery.form does the iframe trick).
 */
window.BaseView = Backbone.View.extend({
  /* == template helpers start == */
  is_new_class : function(){ return this.model.isNew() ? "is_new" : "";},
  is_editable_class : function(){ return (this.is_editable ? "is_editable" : ""); },
  content_editable_text : function(){ return (this.is_editable ? "[finish]" : "[edit]"); },
  content_editable_helper : function(){ return (this.is_editable ? " contentEditable='true' " : ""); },
  /* == template helpers end == */
  file_template : _.template($('#file-template').html()),
  is_editable : false,
  /* === image sizes and URLs related stuff === */
  default_current_view : "thumb",
  views_sizes : {
    "thumb" : [240,160],
  "medium" : [320,240],
  "original" : [460,308]
  },
  image_size : function(){
    if(this.views_sizes.hasOwnProperty(this.current_view || this.default_current_view)){
      return this.views_sizes[this.current_view || this.default_current_view];
    }else{
      return this.views_sizes[this.default_current_view];
    }
  },
  image_url : function(){
    return this.model.get('image_urls')[this.current_view || this.default_current_view];
  },
  /* === event handlers === */
  handle_error : function(model,errors){
    var name;
    $(this.el).find('.editable-holder').removeClass('client_errors');
    $(this.el).find('.client_error').remove();
    for(name in model.errors){
      if(model.errors.hasOwnProperty(name)){
        var ele = $(this.el).find('.'+name+'.editable-holder');
        ele.addClass('client_errors');
        ele.append('<div class="client_error">'+name+' '+model.errors[name]+'</div>');
      }
    }
  },
  do_snapshot : function(event) {
    var the_elem=$(event.currentTarget).closest('.imageEditable');
    the_elem.addClass('spinning');
    var url = '/' + this.resources_name + '/' + this.model.get('id') + '/webcam?' + window.csrf_param + '=' + encodeURI(window.csrf_token);
    var myself=this;
    webcam.snap(url,function(msg){
      return myself.upload_complete(msg,the_elem);
    });
  }, 
  upload_complete : function(msg,el) {
    window.webcam.reset();
    this.model.fetch();
    el.removeClass('spinning');
  },
  toggle_editable: function(ev) {
    this.is_editable = !this.is_editable;
    $(this.el).trigger('editable_changed',this.is_editable);
  },
  /* tries to destroy model (showing a spinner while waiting for what the server has to say) */
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
    var value = $(ev.currentTarget).text();
    var attribute = $(ev.currentTarget).attr('data');
    this.model.pending_changes[attribute]=value;

    if(!this.model.set(this.model.pending_changes,{silent: !window.router.do_client_validations})){
      /* There were errors that will be handled in handle_error callback */
      return;
    }

    /* SUCCESS setting the attribute in the model: remove from pending_changes */
    delete this.model.pending_changes[attribute];
    /* save model to server waiting for response*/
    this.model.save(null,{wait:true,
      success:function(model,resp){
        if(console){ console.log("Changed "+attribute+" from '"+myself.before+"' to '"+value+"'"); }
        /* Remove all error messages: client and server */
        $(myself.el).find('.'+attribute+'.editable-holder .server_error').remove();
        $(myself.el).find('.'+attribute+'.editable-holder .client_error').remove();
      },
      error:function(model,resp){
        var errors = JSON.parse(resp.responseText);
        var ele, name;
        /* Remove all server error messages*/
        $(myself.el).find('.editable-holder').removeClass('server_errors');
        $(myself.el).find('.server_error').remove();
        /* Add all server error messages*/
        for(name in errors){
          if(errors.hasOwnProperty(name)){
            if(name === 'base'){
              $(myself.el).append('<div class="server_error">'+errors[name]+'</div>');
            }else{
              ele = $(myself.el).find('.'+name+'.editable-holder');
              ele.addClass('server_errors');
              ele.append('<div class="server_error">'+name+' '+errors[name]+'</div>');
            }
          }
        }
      }
    });
  },
  on_focus: function(ev){
    this.before =  $(ev.currentTarget).text();
    /* in case this is a LINK (<a href...>) do not follow it ! */
    ev.preventDefault();
    ev.stopImmediatePropagation();
  },
  change_img : function(ev){
    if(!this.is_editable || $(ev.currentTarget).find('form').length !== 0 || this.model.isNew()){
      return true;
    }
    var id = parseInt($(ev.currentTarget).attr('data'),10);
    $(ev.currentTarget).html(this.file_template({id : id, resource : this.resource_name, resources : this.resources_name}));
    var myself=this;
    var myedit=$(this.el).find('.imageEditable');
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
    var imgsize = this.image_size();
    $(this.el).find('.webcam_holder').html(webcam.get_html(imgsize[0],imgsize[1]));
  }
});

window.MonsterView = BaseView.extend({
  resource_name:"monster",
  resources_name:"monsters",
  initialize: function(attrs) {
    this.model.bind('change', this.render, this);
    this.model.bind('destroy', this.remove, this);
    this.model.bind('error', this.handle_error, this);
    this.current_view = attrs.current_view;

    this.fleet_view = new FleetThumbView({model:this.model.get('fleet')});

    if(this.model.isNew()){
      this.is_editable = true;
      this.fleet_view.is_editable=true;
    }

    this.fleet_view.on('changed_fleet',this.changed_fleet_ev_handler,this);

    $(attrs.holder).append(this.render().el);
  },
  changed_fleet_ev_handler : function(iid){
    var myself=this;
    this.model.set('fleet_id',iid);
    var xhr=this.model.save(null,{
      wait : true ,
        success: function(model,resp){
          model.set('fleet',model.find_fleet(iid));
          myself.fleet_view = new FleetThumbView({model:model.get('fleet')});
          myself.fleet_view.is_editable = myself.is_editable;
          myself.fleet_view.on('changed_fleet',myself.changed_fleet_ev_handler,myself);
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
  },
  editable_changed_handler : function(ev,is_editable){
    if(this.fleet_view){
      this.fleet_view.is_editable = is_editable;
    }
    this.render();
  },
  template: _.template($('#monster-template').html()),
  className: 'a-monster',
  events: {
    'editable_changed' : "editable_changed_handler",
    'focus [contentEditable]' : "on_focus",
    'click [contentEditable]' : "on_focus",
    'blur [contentEditable]' : "change",
    'click .shoot' : 'do_snapshot',
    'click span.destroy' : 'destroy_me',
    'click span.make-editable' : 'toggle_editable',
    'click .monster .imageEditable' : 'change_img'
  },
  render: function() {
    $(this.el).html(this.template(this));
    $(this.el).find('.my_fleet').html(this.fleet_view.render().el);
    return this;
  }
});

window.NotFoundView = Backbone.View.extend({
  template: _.template($('#notfound-template').html()),
  initialize: function(opts){
    this.back_to = opts.back_to;
    this.title = opts.title;
    $(opts.holder).html(this.el);
    this.render();
  },
  render: function() {
    $(this.el).html(this.template(this));
    return this;
  }
});

window.SingleView = Backbone.View.extend({
  template: _.template($('#single-template').html()),
  initialize: function(opts){
    this.back_to = opts.back_to;
    this.title = opts.title;
    $(opts.holder).html(this.el);
    this.render();
  },
  render: function() {
    $(this.el).html(this.template(this));
    return this;
  }
});

window.FleetThumbView = Backbone.View.extend({
  image_url : function(model){
    return (model||this.model).get('image_urls').thumb;
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
  resource_name:"fleet",
  resources_name:"fleets",
  template: _.template($('#fleet-template').html()),
  className: 'a-fleet',
  events: {
    'editable_changed' : "render",
  'focus [contentEditable]' : "on_focus",
  'click [contentEditable]' : "on_focus",
  'blur [contentEditable]' : "change",
  'click .shoot' : 'do_snapshot',
  'click span.destroy': 'destroy_me',
  'click span.make-editable' : 'toggle_editable',
  'click .fleet .imageEditable' : 'change_img'
  },
  initialize: function(attrs) {
    this.model.bind('change', this.render, this);
    this.model.bind('destroy', this.remove, this);
    this.model.bind('error', this.handle_error, this);
    this.current_view = attrs.current_view;

    if(this.model.isNew()){
      this.is_editable = true;
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

window.BaseCollectionView = Backbone.View.extend({
  my_filter : null,
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
        col.trigger('fleets_loaded',col);
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
        col.trigger('monsters_loaded',col);
      }
    });
  },
  default_images : {
    thumb : "/images/thumb/missing.png" ,
    medium : "/images/thumb/missing.png" ,
    original : "/images/thumb/missing.png"
  },
  new_monster : function(ev){
    ev.stopImmediatePropagation();
    var m = new Monster({name : "Change me", description : "Some Description", image_urls : this.default_images}, {fleet_collection:this.fleets});
    this.monsters.add(m);
    var mv = new MonsterView({model:m, is_editable : true, holder : $(this.el).find('.monsters')});
    return false;
  },
  new_fleet : function(ev){
    ev.stopImmediatePropagation();
    var m = new Fleet({name : "Change me", description : "Some Description", image_urls : this.default_images, color : generate_color()});
    this.fleets.add(m);
    var fv = new FleetView({model:m, is_editable : true, holder : $(this.el).find('.fleets')});
    return false;
  }
});

window.GeneralView = BaseCollectionView.extend({
  template: _.template($('#all-template').html()),
  monster_views : [],
  fleet_views : [],
  initialize : function(attrs){
    var myself=this;
    this.monsters = attrs.monster_collection;
    this.fleets = attrs.fleet_collection;
    this.holder=attrs.holder;
    $(this.holder).append(this.el);
    this.render();
    this.fleets.on('fleets_loaded',function(col){
      _.each(this.fleet_views,function(view){view.remove();});
      this.fleet_views = [];
      col.each(function(modl){
        this.fleet_views.push(new FleetView({model:modl, holder : $(this.el).find('.fleets')}));
      },this);
      myself.fetch_monsters();
    },this);
    this.monsters.on('monsters_loaded',function(col){
      _.each(this.monster_views,function(view){view.remove();});
      this.monster_views = [];
      col.each(function(modl){
        this.monster_views.push(new MonsterView({model:modl, holder : $(this.el).find('.monsters')}));
      },this);
    },this);
    this.fetch_fleets();
  },
  events : {
    'click a.new-monster' : "new_monster",
    'click a.new-fleet' : "new_fleet"
  },
  render:function(){
    $(this.el).html(this.template());
    _.each(this.fleet_views,function(v){ $(this.el).find('.fleets').append(v.render().el); },this);
    _.each(this.monster_views,function(v){ $(this.el).find('.monsters').append(v.render().el); },this);
  }
});
window.MonsterCollectionView = BaseCollectionView.extend({
  template: _.template($('#all-monsters-template').html()),
  current_view : "medium",
  monster_views : [],
  fleet_views : [],
  initialize : function(opts){
    this.monsters = opts.monster_collection;
    this.fleets = opts.fleet_collection;
    this.my_filter = opts.my_filter;
    $(opts.holder).append(this.el);
    this.render();
    this.fleets.on('fleets_loaded',function(col){
      _.each(this.fleet_views,function(view){view.remove();});
      this.fleet_views = [];
      col.each(function(modl){
        this.fleet_views.push(new FleetView({model:modl, holder : $(this.el).find('.fleets'), current_view : "medium"}));
      },this);
      this.fetch_monsters();
    },this);
    this.monsters.on('monsters_loaded',function(col){
      _.each(this.monster_views,function(view){view.remove();});
      this.monster_views = [];
      col.each(function(modl){
        if(!this.my_filter || this.my_filter(modl)){
          this.monster_views.push(new MonsterView({model:modl, holder : $(this.el).find('.monsters'), current_view : "medium"}));
        }
      },this);
    },this);
    if(!opts.skip_fetch){
      this.fetch_fleets();
    }else{
      this.fetch_monsters();
    }
  },
  events : {
    'click a.new-monster' : "new_monster"
  },
  render:function(){
    $(this.el).html(this.template());
    _.each(this.monster_views,function(v){ $(this.el).find('.monsters').append(v.render().el); },this);
  }
});
window.FleetCollectionView = BaseCollectionView.extend({
  template: _.template($('#all-fleets-template').html()),
  current_view : "medium",
  fleet_views : [],
  initialize : function(opts){
    this.fleets = opts.fleet_collection;
    this.my_filter = opts.my_filter;
    $(opts.holder).append(this.el);
    this.render();
    this.fleets.on('fleets_loaded',function(col){
      _.each(this.fleet_views,function(view){view.remove();});
      this.fleet_views = [];
      col.each(function(modl){
        if(!this.my_filter || this.my_filter(modl)){
          this.fleet_views.push(new FleetView({model:modl, holder : $(this.el).find('.fleets'), current_view : "medium"}));
        }
      },this);
    },this);
    if(!opts.skip_fetch){
      this.fetch_fleets();
    }
  },
  events : {
    'click a.new-fleet' : "new_fleet"
  },
  render:function(){
    $(this.el).html(this.template());
    _.each(this.fleet_views,function(v){ $(this.el).find('.fleets').append(v.render().el); },this);
  }
});

var MonstersApp = Backbone.Router.extend({
  initialize : function(opts){
    this.el = opts.el;
    this.monster_collection = new MonsterCollection();
    this.fleet_collection = new FleetCollection();
    this.viewing = null;
  },
    do_client_validations : true, 
    toggle_client_validations : function(){
      if(this.do_client_validations){
        $(this.el).find(".client_errors").removeClass("client_errors");
        $(this.el).find(".client_error").remove();
      }
      this.do_client_validations = !this.do_client_validations;
    },
    remove_old_view : function(){
      if(this.viewing){
        this.viewing.remove();
      }
    },
    routes: {
      "": "all",  // #all
      "monsters": "index_monsters",    // #monsters
      "fleets":   "index_fleets",      // #fleets
      "monsters/:id" : "show_monster", // #monsters/7
      "fleets/:id":   "show_fleet"    // #fleets/8
    },
    all: function() {
      this.remove_old_view();
      this.viewing = new GeneralView({
        holder: this.el,
        monster_collection : this.monster_collection,
        fleet_collection : this.fleet_collection
      });
    },
    index_monsters: function() {
      this.remove_old_view();
      this.viewing = new MonsterCollectionView({
        holder : this.el,
        monster_collection : this.monster_collection,
        fleet_collection : this.fleet_collection
      });
    },
    index_fleets: function() {
      this.remove_old_view();
      this.viewing = new FleetCollectionView({
        holder : this.el,
        fleet_collection : this.fleet_collection
      });
    },
    show_monster: function(id_string) {
      this.remove_old_view();
      var id = parseInt(id_string,10);
      var myself=this;
      var monster = this.monster_collection.get(id);
      if(monster){
        this.viewing = new SingleView({ title : "Monster "+id, holder : this.el, back_to : "#monsters" });
        var thingy= new MonsterView({model:monster, holder : $(this.viewing.el).find('.holding'), current_view : "original"  });
      }else{
        this.monster_collection.fetch({
          fleet_collection: this.fleet_collection,
          error: function(col,resp){
            myself.viewing = new NotFoundView({ title : "Monster " + id +" not found (Server Error)", holder : myself.el, back_to : "#monsters"});
          },
          success: function(col){
            col.trigger('monsters_loaded',col);
            var monster = col.get(id);
            if(monster){
              myself.viewing = new SingleView({ title : "Monster "+id, holder : myself.el, back_to : "#monsters" });
              var thingy= new MonsterView({model:monster, holder : $(myself.viewing.el).find('.holding'), current_view : "original"  });
            }else{
              myself.viewing = new NotFoundView({ title : "Monster "+id+" NOT FOUND", holder : myself.el, back_to : "#monsters"});
            }
          }
        });
      }
    },
    show_fleet: function(id_string) {
      this.remove_old_view();
      var id = parseInt(id_string,10);
      var myself=this;
      var fleet = this.fleet_collection.get(id);
      if(fleet){
        this.viewing = new SingleView({ title : "Fleet "+id, holder : this.el, back_to : "#fleets" });
        var thingy = new FleetView({ model: fleet, holder : $(this.viewing.el).find('.holding'), current_view : "original" });
        var thingyl = new MonsterCollectionView({
          skip_fetch : true,
          monster_collection : this.monster_collection,
            fleet_collection : this.fleet_collection,
            holder : $(this.viewing.el).find('.holding'),
            current_view : "original",
            my_filter : function(m){return m.get('fleet_id') === id;}
        });
      }else{
        this.fleet_collection.fetch({
          error: function(col,resp){
            myself.viewing = new NotFoundView({ title : "Fleet "+id+" (Server Error)", holder : myself.el, back_to : "#fleets"});
          },
          success: function(col){
            col.trigger('monsters_loaded',col);
            var fleet = col.get(id);
            if(fleet){
              myself.viewing = new SingleView({ title : "Fleet "+id, holder : myself.el , back_to : "#fleets"});
              var thingy = new FleetView({ model: fleet, holder : $(myself.viewing.el).find('.holding'), current_view : "original"  });
              var thingyl = new MonsterCollectionView({
                skip_fetch : true,
                fleet_collection : myself.fleet_collection,
                monster_collection : myself.monster_collection,
                holder : $(myself.viewing.el).find('.holding'),
                  current_view : "original",
                  my_filter : function(m){return m.get('fleet_id') === id;} });
            }else{
              myself.viewing = new NotFoundView({ title : "Fleet "+id+" NOT FOUND", holder : myself.el, back_to : "#monsters"});
            }
          }
        });
      }
    }
});
