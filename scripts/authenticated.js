Y.use([
  'node'
], function () {

  Y.namespace('Supply');

  Y.Supply.Auth = Singleton.create({
    ready: function () {
      Y.on('domready', this.bindUI, this);
    },

    bindUI: function () {


      Y.Global.on('tweak:change', function (tweak) {

        if (Y.Supply.Site.masonry) {

          // Set product gutter
          if (tweak.getName() == ('productGutter' || 'indexGutter')) Y.Supply.Site.masonry.set('gutter', parseInt(tweak.getValue(), 10));

          // Set product column width
          if (tweak.getName() == ('productColumnWidth' || 'indexColumnWidth')) Y.Supply.Site.masonry.set('columnWidth', parseInt(tweak.getValue(), 10));


          // Refresh the gallery, 500ms feels good

          Y.later(500, this, function(){
            Y.Supply.Site.syncUI();
          });
        }
      });


      Y.Global.on('tweak:reset', function (tweak) {
        Y.later(500, this, function(){

          // Set columnWidth and gutter for masonry
          if (Y.one('.collection-type-products.view-list') && Y.Supply.Site.masonry){
            Y.Supply.Site.masonry.set('columnWidth', parseInt(Y.Squarespace.Template.getTweakValue('productColumnWidth'), 10));
            Y.Supply.Site.masonry.set('gutter', parseInt(Y.Squarespace.Template.getTweakValue('productGutter'), 10));
          } else if (Y.one('.collectipn-type-index') && Y.Supply.Site.masonry) {
            Y.Supply.Site.masonry.set('columnWidth', parseInt(Y.Squarespace.Template.getTweakValue('indexColumnWidth'), 10));
            Y.Supply.Site.masonry.set('gutter', parseInt(Y.Squarespace.Template.getTweakValue('indexGutter'), 10));
          }

          Y.Supply.Site.syncUI();
        });
      });

    }
    
  });
});