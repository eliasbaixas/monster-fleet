window.Monster = Backbone.Model.extend({
  initialize: function(){
    var name = this.get('name');
    var desc = this.get('description');
    var img = this.get('image_url');
  }
});
    
window.Monsters = Backbone.Collection.extend({
  model: Monster,
  url: 'monsters',
});

window.monsters = new Monsters();

window.MonsterView = Backbone.View.extend({
    template: _.template($('#monster-template').html()),
    tag: 'ul',
    className: 'a-monster',
    events: {
        'change [contentEditable]': 'change',
        'destroy div.destroy': 'destroy_me'
    },

    initialize: function() {
        this.model.bind('change', this.render, this);
        this.model.bind('destroy', this.remove, this);

        $('#monsters').append(this.render().el);
    },

    destroy_me: function() {
      this.model.destroy();
    },
    render: function() {
        var data = this.model.toJSON();
        $(this.el).html(this.template(data));
        return this;
    },

    change: function(ev){
      var txt = $(ev.currentTarget).text();
      var which = $(ev.currentTarget).attr('data');
      if(txt){
        this.model.set(which,txt);
        this.model.save();
      } else {
        console.log('destroy');
        this.model.destroy();
      }
    }
});
