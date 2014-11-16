// View for creating hero images that uses large
// hero backgrounds.

// Requires
// - backgroundcheck
// - fittext

// Usage
// this.hero = new HeroView({el: $('.cover-image') });

define([
'jquery',
'underscore',
'backbone',
'backgroundcheck',
'jquery.backstretch',
'fittext',
'imagesloaded'
], function ($, _, Backbone, BackgroundCheck) {

var HeroImageView = Backbone.View.extend({
  initialize: function (opts) {
    console.log('initialized HeroImageView')
    opts = opts || {};
    this.onLoad = opts.onLoad;

    this.textCompressor = opts.textCompressor || 3.75;
    this.textParams = opts.textParams || { minFontSize: '50px' };

    this.offset = this.$el.offset().top;
    this.$titleText = this.$el.find('.title');
    if ($.fn.fitText) {
      this.$titleText.fitText(this.textCompressor, this.textParams);
    }

    var url = this.$el.data('image'); 

    this.$el.backstretch(url, {
      centeredY: false
    });

    this.$el.imagesLoaded(_.bind(this.imagesLoaded, this));

    this.resizeEvent = 'resize.parallax-'+window.Born.guid();
    this.scrollEvent = 'scroll.parallax-'+window.Born.guid();

    $(window).on(this.resizeEvent, _.bind(this.resize, this));
    $(window).on(this.scrollEvent, _.bind(this.scroll, this));
  },
  imagesLoaded: function () {
    var img = this.$el.find('img')[0];
    this.ratio = img.naturalWidth / img.naturalHeight;

    $('#content.project-single').addClass('active');

    var self = this;
    _.delay(function () {
  
      BackgroundCheck.init({
        targets: '.cover-image .title',
        images: '.cover-image .backstretch img',
        debug: true
      });

      _.defer(function () {
        var $title = self.$el.find('.title');

        if ($title.hasClass('background--complex')) {
          self.$el.data('nav-color', '#eee');
          $title.data('nav-color', '#eee');
        } else if ($title.hasClass('background--dark')) {
          self.$el.data('nav-color', '#fff');
          $title.data('nav-color', '#fff');
        } else {
          // self.$el.data('nav-color', '#000');
          // $title.data('nav-color', '#000');
        }
    
        self.$el.addClass('active');
        $title.addClass('active');

        if (_.isFunction(self.onLoad)) {
          /* Hack needed to get fade enabled when hero image is being used */
          setTimeout(function () {
            self.$el.backstretch('resize');
            self.onLoad();
          }, 500);
        }
      });

    }, 250);

    this.resize();
    this.scroll();
  },
  resize: function () {
    this.offset = this.$el.offset().top;

    var w = $(window).width();
    var h = w/this.ratio;
    this.$el.find('.backstretch').height(h - (h*0.1));

    var self = this;
    _.defer(function () {
      self.$el.height(h - (h*0.1));
    });
    
    this.$titleText.fitText(this.textCompressor, this.textParams);
  },
  scroll: function () {
    var t = $(window).scrollTop();
    var hs = $('header.section').outerHeight();
    var s = ((t+hs) - this.offset);
    var perc = s / (this.$el.height());

    var h = this.$el.height()/this.ratio;
    var t = (100 * perc) - (this.$titleText.height()/2);
    var ls = 5 + 10 * perc;

    this.$el.find('.title').css({
      // 'opacity': 1-perc,
      'margin-top': t,
      // 'letter-spacing': ls + 'px'
    });

    if(perc <= .15 && this.$el.hasClass('fade')) {
      this.$el.removeClass('fade');
    } else if(perc > .01 && !this.$el.hasClass('fade')) {
      this.$el.addClass('fade');
    }

    if (perc > 1) {
      return;
    }

    if (perc < 0) {
      if (this.moved) {
        this.$el.find('.backstretch img').css('top', 0);
      }
      return;
    }

    var $bg = this.$el.find('.backstretch img').first();
    var diff = $bg.height() - this.$el.height();

    $bg.css({
      top: (-diff * perc)
    });

    this.moved = true;
  },
  destroy: function () {
    $(window).off(this.resizeEvent);
    $(window).off(this.scrollEvent);
    BackgroundCheck.destroy();

    this.undelegateEvents();
    this.$el.removeData().unbind(); 
    Backbone.View.prototype.remove.call(this);
  }
});

return HeroImageView;
});
