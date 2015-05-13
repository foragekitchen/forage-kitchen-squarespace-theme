Y.use([
  'node',
  'squarespace-gallery-ng',
  'squarespace-util'
], function () {

  Y.namespace('Supply');

  Y.Supply.Site = Singleton.create({

    ready: function () {

      Y.on('domready', this.initialize, this);
    },

    initialize: function () {
      
      // Add ie10 class

      if (Function('/*@cc_on return document.documentMode===10@*/')()) {
        document.documentElement.className+=' ie10';
      }


      // Set the empty nav class if there are no links
      this._emptyNav();


      // Run product-specific initialize methods
      if (Y.one('.collection-type-products')) {
        this._initProducts();
      }


      // Initialize masonry

      if (Y.one('#main .masonry-item')) {
        this._initMasonry({
          width: Y.one('.collection-type-index') ? parseInt(Y.Squarespace.Template.getTweakValue('indexColumnWidth'), 10) : parseInt(Y.Squarespace.Template.getTweakValue('productColumnWidth'), 10),
          gutter: Y.one('.collection-type-index') ? parseInt(Y.Squarespace.Template.getTweakValue('indexGutter'), 10) : parseInt(Y.Squarespace.Template.getTweakValue('productGutter'), 10)
        });
      }


      // Bind event handlers
      this.bindUI();


      // Run sync events
      this.syncUI();


      // Remove loading classes
      if (Y.one('.products-collection')) { 
        Y.all('.products-collection').removeClass('loading');
      }
      if (Y.one('#flowContent .flow-back')) {
        Y.one('.flow-back').removeClass('loading');
      }
      if (Y.one('#flowContent')) {
        Y.one('#flowContent').removeClass('loading');
      }
      if (Y.one('.masonry-container')) {
        Y.one('.masonry-container').removeClass('loading');
      }
      Y.one('#header .lower-header').removeClass('loading');
      Y.one('#header > .wrapper').removeClass('loading');
    },

    bindUI: function () {

      // Handle resize
      var resizeEmitter = new Y.Squarespace.ResizeEmitter( { timeout: 100 } );
      
      resizeEmitter.on('resize:end', this.syncUI, this);

      // Bind nav open

      Y.one('#navOpen').on('click', function (e) {
        e.halt();
        Y.one('body').addClass('nav-opened');
      });


      // Bind nav close

      Y.one('#navClose').on('click', function (e) {
        e.halt();
        Y.one('body').removeClass('nav-opened');
      });


      // Bind canvas overlay to close nav

      Y.one('#canvasOverlay').on('click', function (e){
        e.halt();
        Y.one('body').removeClass('nav-opened');
      });


      // Bind nav folder links to open/close

      Y.one('#header').delegate('click', function (e) {
        if (Y.one('.folder-links-collapsible')) {
          e.preventDefault();
          this._toggleFolder(e.currentTarget.get('parentNode'));
        }
      }, '.folder-collection > a', this);


      // Bind products events

      if (Y.one('.collection-type-products')) {
        this._bindProducts();
      }


      // Bind gallery events

      if (Y.one('.collection-type-gallery')) {
        this._bindGallery();
      }
    },

    syncUI: function () {

      if (Y.one('.site-vertical-alignment-middle')) {
        /*
          Set the header wrapper to align middle,
          if this tweak option is chosen and there
          is enough room.

          DESKTOP only.
        */
        if (Y.config.win.innerWidth > 1024) {
          var headerWrapper = Y.one('#header > .wrapper');
          headerWrapper.toggleClass('middle', Y.config.win.innerHeight > headerWrapper.get('offsetHeight'));
        }
      }

      // Position lower header
      this._positionLowerHeader();

      // Handle announcement bar on tablet/mobile

      if (Y.one('.sqs-announcement-bar')) {
        this._setMobileAnnouncementPosition();
      }


      // Sync masonry
      if (Y.one('.masonry-item')) {
        this._syncMasonry();
      }

      // Sync products
      if (Y.one('.collection-type-products')) {
        this._syncProducts();
      }

      // Sync index
      if (Y.one('.collection-type-index')) {
      }

      // Sync flow
      if (Y.one('#flowItems .flow-item')) {
        this._syncFlow();
      }

      // Refresh masonry
      if (this.masonry) {
        this.masonry.refresh();
      }

      // Load Images
      this._imgLoad();
    },

    _initProducts: function () {

      /*
        In nav, remove active link class from parent
        collection when one of its children is an
        active link.
      */

      Y.all('.products-child .active-link').each(function (link) {
        link.ancestor('.products-collection').removeClass('active-link');
      });


      /*
        Set hrefs for each product on products.list,
        and for the back link on products.item, adding
        a query string to track if the user clicked through
        from a category or from the main products collection.
        Also change the label on the back link to match.
      */

      var location = Y.config.win.location;
      if (Y.one('.view-item')) {
        var flowBack = Y.one('.flow-back');
        flowBack.setAttribute('href', flowBack.getAttribute('href') + location.search);
        if (location.search.length > 0) {
          flowBack.setHTML(decodeURI(location.search.substr(location.search.indexOf('=') + 1)));
        }
      }

    },

    _initMasonry: function (config) {

      // Create new gallery for the masonry grid

      this.masonry = new Y.Squarespace.Gallery2({
        container: Y.one('.masonry-container'),
        element: Y.all('.masonry-item'),
        design: Y.one('.collection-type-index.index-aspect-ratio-auto') || Y.one('.collection-type-products.product-aspect-ratio-auto') ? 'autocolumns' : 'autogrid',
        designOptions: {
          columnWidth: config.width,
          columnWidthBehavior: 'min',
          gutter: config.gutter,
          aspectRatio: false,
          mixedContent: true
        },
        loaderOptions: { load: false },
        lazyLoad: false,
        refreshOnResize: true
      });

    },

    _bindProducts: function () {

      /*
        Bind the click handler for the flowBody
        open and close buttons. flowBody contains
        the "Additional Info" for each product item
      */

      if (Y.one('#flowBody')) {
        Y.one('#flowBodyOpen').on('click', function (e) {
          e.preventDefault();
          Y.one('body').addClass('flow-body-active');
        });
        Y.one('#flowBodyClose').on('click', function (e) {
          e.preventDefault();
          Y.one('body').removeClass('flow-body-active');
        });
      }

    },

    _bindGallery: function () {

      /*
        Bind the click handler for flow-item-info,
        the title/description for each picture in
        the gallery.
      */

      if (Y.one('#flowItems .flow-item-info')) {
        Y.one('#flowItems').delegate('click', function (e) {
          e.preventDefault();
          this.ancestor('.flow-item').toggleClass('active').siblings().removeClass('active');
        }, '.flow-item.has-info .button-expand');
      }

    },

    _syncMasonry: function () {

      // Set masonry content height
      this._setContentHeight();


      /*
        If the aspect ratio is not set to "auto",
        set the content mode for the masonry gallery
        to fill, so images will fill whatever aspect
        ratio is selected (aspect ratio is set in CSS).
      */


      var prefix = 'product';
      if (Y.one('.collection-type-index')) {
        prefix = 'index';
      }
      if (Y.one('.' + prefix + '-aspect-ratio-auto')) {
        this.masonry.refreshContentMode(null);
      } else {
        this.masonry.refreshContentMode('fill')
      }

    },

    _syncIndex: function () {

      // Set gutter for index
      this._setGutter(parseInt(Y.Squarespace.Template.getTweakValue('indexGutter'), 10));

    },

    _syncProducts: function () {

      if (Y.one('.view-list')) {

        // Set gutter for products
        this._setGutter(parseInt(Y.Squarespace.Template.getTweakValue('productGutter'), 10));

      }

    },

    _syncFlow: function () {

      var flowItems = Y.one('#flowItems');
      var flowContent = Y.one('#flowContent');
      var flowItemsHeightExceeded = this._predictFlowItemsHeight();


      /*
        Determine whether flowItems or flowContent
        should be fixed, depending on whether each
        overflows the viewport height

        TABLET and DESKTOP breakpoint only
      */

      if (Y.config.win.innerWidth > 640) {
        if (flowContent.get('offsetHeight') > Y.config.win.innerHeight) {
          // flowContent exceeded, clear flowContent style and force top alignment
          flowContent.setAttribute('style', '');
          Y.one('body').addClass('force-vertical-alignment-top');
          if (flowItemsHeightExceeded) {
            // Both exceeded, clear flowItems style
            flowItems.setAttribute('style', '');
          } else {
            // flowItems not exceeded, set flowItems to fixed
            flowItems.setStyle('position', 'fixed');
          }
        } else {
          // flowContent not exceeded, allow middle alignment
          Y.one('body').removeClass('force-vertical-alignment-top');
          if (flowItemsHeightExceeded) {
            // flowItems exceeded, set flowContent to fixed
            flowContent.setStyle('position', 'fixed');
            flowItems.setAttribute('style', '');
          } else {
            // Both not exceeded, do nothing since you can't scroll
          }
        }
      } else {
        // Mobile, clear both styles
        Y.one('body').removeClass('force-vertical-alignment-top');
        flowItems.setAttribute('style', '');
        flowContent.setAttribute('style', '');
      }


      /*
        When vertical alignment is set to middle,
        set flowItems to align to middle, if there
        is enough room.

        DESKTOP breakpoint only
      */

      if (Y.one('.site-vertical-alignment-middle') && Y.config.win.innerWidth > 1024) {
        if ((Y.one('.collection-type-gallery') && !Y.one('.gallery-single-image-fill')) ||
            (Y.one('.collection-type-products') && !Y.one('.product-item-single-image-fill')) ||
            Y.one('.flow-item:nth-child(2)'))
        {
          // Toggle middle class based on whether flowItems height is greater than viewport height
          flowItems.toggleClass('middle', !flowItemsHeightExceeded);
        }
      } else {
        // Tablet or mobile, remove middle class
        flowItems.removeClass('middle');
      }


      /*
        Set the body classes necessary for the
        gallery and product single image fill
        tweak.

        TABLET and DESKTOP breakpoints
      */

      if (((Y.one('.collection-type-gallery') && Y.one('.gallery-single-image-fill')) ||
          (Y.one('.collection-type-products') && Y.one('.product-item-single-image-fill'))) &&
          Y.all('.flow-item').size() === 1
        ) 
      {
        if (Y.config.win.innerWidth > 640) {
          Y.one('body').addClass('flow-items-fill');
          Y.one('.flow-item').addClass('content-fill');
        } else {
          Y.one('body').removeClass('flow-items-fill');
          Y.one('.flow-item').removeClass('content-fill');
          Y.one('.flow-item img').setAttribute('style','');
        }
      }


    },

    _setMobileAnnouncementPosition: function () {
      /*
        The mobile nav container #under is set to
        position: fixed, so it needs to have a set
        offset from top when the announcement bar
        is present, so it doesn't overlap. The case
        of the announcement bar being hidden is
        handled in CSS.

        MOBILE and TABLET only
      */
      if (Y.config.win.innerWidth <= 1024) {
        var height = Y.one('.sqs-announcement-bar').get('offsetHeight');
        Y.one('#under').setStyle('top', height);
      } else {
        Y.one('#under').setAttribute('style', '');
      }
    },

    _predictFlowItemsHeight: function () {

      /*
        Based on the dimensions stored in each 
        image in flowItems, calculate the height
        of flowItems.
      */

      var height = 0;
      var flowImages = Y.all('.flow-item img');

      for (var i = 0; i < flowImages.size(); i++) {
        var img = flowImages.item(i);
        var imgDim = img.getAttribute('data-image-dimensions');
        var imgRatio = parseFloat(imgDim.split('x')[1] / imgDim.split('x')[0]);

        height += imgRatio * parseFloat(img.getComputedStyle('width')) + parseFloat(img.get('parentNode').getStyle('marginBottom'));

        if (height > Y.config.win.innerHeight) {
          return true;
        }
      }

      return false;

    },

    _setGutter: function (gutter) {

      /*
        Given a gutter (either product or index),
        limit that gutter to 10px on mobile, and 
        25px on tablet, but do not change it if it
        is less than 10px or 25px already (in those
        situations).
      */

      if (this.masonry) {
        if (gutter < 10) {
          // Gutter less than 10, set to gutter
          this.masonry.set('gutter', gutter);
        } else if (gutter < 25) {
          // Gutter is less than 25
          if (Y.config.win.innerWidth <= 640) {
            // Mobile, set gutter to 10
            this.masonry.set('gutter', 10);
          }else{
            // Tablet + Desktop, gutter is as set
            this.masonry.set('gutter', gutter);
          }
        } else {
          if (Y.config.win.innerWidth <= 640) {
            // Mobile, set gutter to 10
            this.masonry.set('gutter', 10);
          } else if (Y.config.win.innerWidth <= 1024) {
            // Tablet, set product gutter to 25
            this.masonry.set('gutter', 25);
          } else {
            // Desktop, product gutter is as set
            this.masonry.set('gutter', gutter);
          }
        }
      }

    },

    _setContentHeight: function () {

      /*
        In "catalog" mode for products and
        "under" mode for indexes, where the
        content appears underneath the picture,
        set the height of each of these content
        areas the same so the pictures line up.

        TABLET and DESKTOP breakpoint only
      */

      if ((Y.one('.product-list-style-catalog.collection-type-products') && !Y.one('.product-aspect-ratio-auto')) ||
          (Y.one('.index-list-title-style-under.collection-type-index') && !Y.one('.index-aspect-ratio-auto')))
      {
        if (Y.config.win.innerWidth > 640) {
          // Set height
          var max = 0;
          Y.all('.masonry-content').each(function(item){
            if(item.get('clientHeight') > max){
              max = item.get('clientHeight');
            }
          });
          Y.all('.masonry-content').setStyle('height', max);
        } else {
          // Mobile, remove height
          if (Y.one('.masonry-content').getAttribute('style')){
            Y.all('.masonry-content').each(function(e){
              e.setAttribute('style','');
            });
          }
        }
      } else {
        // Masonry, but auto aspect ratio. Remove height.
        if (Y.one('.masonry-content').getAttribute('style')){
          Y.all('.masonry-content').each(function(e){
            e.setAttribute('style','');
          });
        }
      }

    },

    _toggleFolder: function (folder) {

      /*
        To be placed inside the event handler for
        folders on the header nav – adds and removes
        the proper classes from folders.
      */

      if (folder.hasClass('folder-closed')) {
        // Folder has been closed by user
        folder.addClass('folder-opened');
        folder.removeClass('folder-closed');
      } else if (folder.hasClass('folder-opened')) {
        // Folder has been opened by the user
        folder.removeClass('folder-opened');
        folder.addClass('folder-closed');
      } else if (folder.hasClass('active-folder')) {
        // Folder has not been touched by user, but is open because it is active
        folder.addClass('folder-closed');
      } else {
        // Folder has not been touched by user
        folder.addClass('folder-opened');
      }
      this._positionLowerHeader();
    },

    _positionLowerHeader: function () {

      /*
        If there is enough room, set a class on
        the secondary nav + social (lower header)
        to move it to the bottom, when site vertical
        alignment is set to top.

        DESKTOP breakpoint only.
      */

      if (Y.config.win.innerWidth > 1024 && Y.one('.site-vertical-alignment-top')) {
        var headerWrapper = Y.one('#header > .wrapper');
        var lowerHeader = Y.one('#header .lower-header');
        var headerHeight = lowerHeader.hasClass('bottom') ? lowerHeader.get('offsetHeight') + headerWrapper.get('offsetHeight') : headerWrapper.get('offsetHeight');

        lowerHeader.toggleClass('bottom', Y.config.win.innerHeight > headerHeight);
      }
    },

    _emptyNav: function () {

      /*
        If there are no links in the nav, add
        a button to hide the toggle for the 
        mobile nav.
      */

      if (Y.one('#navOpen') && !Y.one('.navigation li') && !Y.one('.navigation-secondary li')) {
        Y.one('#navOpen').addClass('empty');
      }

    },

    _imgLoad: function (wrapper, mode) {
      wrapper = wrapper || 'body';
      mode = mode || null;

      Y.all(wrapper + ' img[data-src]:not([data-load="false"])').each(function(img) {
        ImageLoader.load(img, {
          mode: mode
        });
      });
    }

  });

});
