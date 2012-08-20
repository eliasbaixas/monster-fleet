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
  errors : {},
  pending_changes : {},
  ensure_errors_for : function(name){
    if(!this.errors[name]){
      this.errors[name]=[];
    }
  },
  validates_presence_of : function(name,attrs){
    var v = this.pending_changes[name] || attrs[name];
    if(!v){
      this.ensure_errors_for(name);
      this.errors[name].push(" must be present.");
      return false;
    }
    return true;
  },
validates_length_of : function(name,attrs,min,max){
  var v = this.pending_changes[name] || attrs[name];
  if(min && v.length < min){
    this.ensure_errors_for(name);
    this.errors[name].push(" must be longer than " + min + " characters.");
    return false;
  }
  if(max && v.length > max){
    this.ensure_errors_for(name);
    this.errors[name].push(" must be shorter than " + max + " characters.");
    return false;
  }
  return true;
},
  validates_format_of : function(name,attrs,regex){
    var v = this.pending_changes[name] || attrs[name];
    if(!v.match(regex)){
      this.ensure_errors_for(name);
      this.errors[name].push(" is not well-formed (must match "+regex+").");
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
          this.ensure_errors_for(name);
          this.errors[name].push(" must be unique.");
          return false;
        }
      }
    }
    return true;
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

window.MonsterCollection = Backbone.Collection.extend({
  model: Monster,
  url: 'monsters'
});

window.Fleet = BaseModel.extend({
  initialize: function(attrs,opts){
    this.on("error", function(model, error) {
      if(console){
        for(var nam in error){
          if(error.hasOwnProperty(nam)){
            console.log(nam + " "+ error[nam]);
          }
        }
      }
      return true;
    });
  }, 
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
  handle_error : function(model,errors){
    var nam;
    $(this.el).find('.editable-holder').removeClass('client_errors');
    $(this.el).find('.client_error').remove();
    for(nam in model.errors){
      if(model.errors.hasOwnProperty(nam)){
        var ele = $(this.el).find('.'+nam+'.editable-holder');
        ele.addClass('client_errors');
//        ele.find('.client_error').remove();
//        ele.find('[contentEditable]').html(model.get(nam));
        ele.append('<div class="client_error">'+nam+' '+model.errors[nam]+'</div>');
      }
    }
  },
  do_snapshot : function(event) {
    var the_elem=$(event.currentTarget).closest('.imgeditable');
    the_elem.addClass('spinning');
    var url = '/' + this.resources + '/' + this.model.get('id') + '/webcam?' + window.csrf_param + '=' + encodeURI(window.csrf_token);
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
    this.model.pending_changes[which]=txt;
    console.log("pending_changes:");
    console.log(this.model.pending_changes);
    if(this.model.set(this.model.pending_changes,{silent: !window.router.do_client_validations})){
      delete this.model.pending_changes[which];
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
          $(myself.el).find('.editable-holder').removeClass('server_errors');
          $(myself.el).find('.server_error').remove();
//        $(ev.currentTarget).html(myself.before);
          for(nam in json){
            if(json.hasOwnProperty(nam)){
              if(nam === 'base'){
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
/*    if(xhr){
        $(ev.currentTarget).removeClass('has_errors');
      }*/
    }else{
      this.model.pending_changes[which] = txt;
//    $(ev.currentTarget).addClass('has_errors');
    }
  },
  on_focus: function(ev){
    this.before =  $(ev.currentTarget).text();
    ev.preventDefault();
    ev.stopImmediatePropagation();
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
    var imgsize = this.image_size();
    $(this.el).find('.webcam_holder').html(webcam.get_html(imgsize[0],imgsize[1]));
  }
});

window.MonsterSmallView = BaseView.extend({
  resource:"monster",
  resources:"monsters",
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

    var myself=this;
    function changed_fleet_ev_handler(iid){
      this.model.set('fleet_id',iid);
      var xhr=this.model.save(null,{
        wait : true ,
          success: function(model,resp){
            model.set('fleet',find_fleet(model.fleet_collection, iid));
            myself.fleet_view = new FleetThumbView({model:model.get('fleet')});
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
    'click [contentEditable]' : "on_focus",
    'blur [contentEditable]' : "change",
    'click .shoot' : 'do_snapshot',
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

window.FleetSmallView = BaseView.extend({
  resource:"fleet",
  resources:"fleets",
  template: _.template($('#fleet-template').html()),
  tag: 'ul',
  className: 'a-fleet',
  events: {
    'editable_changed' : "render",
  'focus [contentEditable]' : "on_focus",
  'click [contentEditable]' : "on_focus",
  'blur [contentEditable]' : "change",
  'click .shoot' : 'do_snapshot',
  'click span.destroy': 'destroy_me',
  'click span.make-editable' : 'toggle_editable',
  'click .fleet .imgeditable' : 'change_img'
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

window.BigBaseView = Backbone.View.extend({
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
    var mv = new MonsterSmallView({model:m, is_editable : true, holder : $(this.el).find('.monsters')});
    return false;
  },
  new_fleet : function(ev){
    ev.stopImmediatePropagation();
    var m = new Fleet({name : "Change me", description : "Some Description", image_urls : this.default_images, color : generate_color()});
    this.fleets.add(m);
    var fv = new FleetSmallView({model:m, is_editable : true, holder : $(this.el).find('.fleets')});
    return false;
  }
});

window.GeneralView = BigBaseView.extend({
  template: _.template($('#all-template').html()),
  initialize : function(attrs){
    var myself=this;
    this.monsters = attrs.monster_collection;
    this.fleets = attrs.fleet_collection;
    this.monster_views = [];
    this.fleet_views = [];
    this.holder=attrs.holder;
    $(this.holder).append(this.el);
    this.render();
    this.fleets.on('fleets_loaded',function(col){
      console.log("Processing fleets_loaded");
      _.each(this.fleet_views,function(view){view.remove();});
      this.fleet_views = [];
      col.each(function(modl){
        this.fleet_views.push(new FleetSmallView({model:modl, holder : $(this.el).find('.fleets')}));
      },this);
      myself.fetch_monsters();
    },this);
    this.monsters.on('monsters_loaded',function(col){
      _.each(this.monster_views,function(view){view.remove();});
      this.monster_views = [];
      col.each(function(modl){
        this.monster_views.push(new MonsterSmallView({model:modl, holder : $(this.el).find('.monsters')}));
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
window.MonsterCollectionView = BigBaseView.extend({
  template: _.template($('#all-monsters-template').html()),
  current_view : "medium",
  initialize : function(opts){
    this.monsters = opts.monster_collection;
    this.fleets = opts.fleet_collection;
    this.monster_views = [];
    this.fleet_views = [];
    $(opts.holder).append(this.el);
    this.render();
    this.fleets.on('fleets_loaded',function(col){
      console.log("Processing fleets_loaded");
      _.each(this.fleet_views,function(view){view.remove();});
      this.fleet_views = [];
      col.each(function(modl){
        this.fleet_views.push(new FleetSmallView({model:modl, holder : $(this.el).find('.fleets'), current_view : "medium"}));
      },this);
      this.fetch_monsters();
    },this);
    this.monsters.on('monsters_loaded',function(col){
      _.each(this.monster_views,function(view){view.remove();});
      this.monster_views = [];
      col.each(function(modl){
        this.monster_views.push(new MonsterSmallView({model:modl, holder : $(this.el).find('.monsters'), current_view : "medium"}));
      },this);
    },this);
    this.fetch_fleets();
  },
  events : {
    'click a.new-monster' : "new_monster"
  },
  render:function(){
    $(this.el).html(this.template());
    _.each(this.monster_views,function(v){ $(this.el).find('.monsters').append(v.render().el); },this);
  }
});
window.FleetCollectionView = BigBaseView.extend({
  template: _.template($('#all-fleets-template').html()),
  current_view : "medium",
  initialize : function(opts){
    this.fleets = opts.fleet_collection;
    this.fleet_views = [];
    $(opts.holder).append(this.el);
    this.render();
    this.fleets.on('fleets_loaded',function(col){
      console.log("Processing fleets_loaded");
      _.each(this.fleet_views,function(view){view.remove();});
      this.fleet_views = [];
      col.each(function(modl){
        this.fleet_views.push(new FleetSmallView({model:modl, holder : $(this.el).find('.fleets'), current_view : "medium"}));
      },this);
    },this);
    this.fetch_fleets();
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
    }else{
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
      console.log("GOING TO fleets");
    },
    show_monster: function(id_string) {
      this.remove_old_view();
      var id = parseInt(id_string,10);
      var myself=this;
      var monster = this.monster_collection.get(id);
      if(monster){
        this.viewing = new SingleView({ title : "Monster "+id, holder : this.el, back_to : "#monsters" });
        var thingy= new MonsterSmallView({model:monster, holder : $(this.viewing.el).find('.holding'), current_view : "original"  });
      }else{
        this.monster_collection.fetch({
          fleet_collection: this.fleet_collection,
          error: function(col,resp){
            console.log('error:');
            console.log(resp);
          },
          success: function(col){
            col.trigger('monsters_loaded',col);
            var monster = col.get(id);
            if(monster){
              myself.viewing = new SingleView({ title : "Monster "+id, holder : myself.el, back_to : "#monsters" });
              var thingy= new MonsterSmallView({model:monster, holder : $(myself.viewing.el).find('.holding'), current_view : "original"  });
            }
          }
        });
        console.log("MONSTER NOT FOUND:"+id);
      }
    },
    show_fleet: function(id_string) {
      this.remove_old_view();
      var id = parseInt(id_string,10);
      var myself=this;
      var fleet = this.fleet_collection.get(id);
      if(fleet){
        this.viewing = new SingleView({ title : "Fleet "+id, holder : this.el, back_to : "#fleets" });
        var thingy = new FleetSmallView({ model: fleet, holder : $(this.viewing.el).find('.holding'), current_view : "original" });
      }else{
        this.fleet_collection.fetch({
          error: function(col,resp){
            console.log('error:');
            console.log(resp);
          },
          success: function(col){
            col.trigger('monsters_loaded',col);
            var fleet = col.get(id);
            if(fleet){
              myself.viewing = new SingleView({ title : "Fleet "+id, holder : myself.el , back_to : "#fleets"});
              var thingy = new FleetSmallView({ model: fleet, holder : $(myself.viewing.el).find('.holding'), current_view : "original"  });
            }
          }
        });
      }
      console.log("GOING TO fleet "+id);
    }

});
