// Global slider view

// requires
//  - backbone
//  - a slider with following dom elements:
// 
// slider --> frame --> overflow --> slides

// Usage
// this.slider = new SliderView({el: $('.slider') });

define([
'jquery',
'underscore',
'backbone',
], function ($, _, Backbone) {

"use strict";

var events = {
  'mobile': {
    'touchstart .next': 'next',
    'touchstart .prev': 'prev',
    'touchstart .nav li': function (e) {
      var index = $(e.currentTarget).index();
      this.goto(index);
      e.preventDefault();
    },
    'handleSwipe': function (e) {
      console.log('here');
      return false;
    }    
  },
  'desktop': {
    'click .next': 'next',
    'click .prev': 'prev',
    'click .nav li': function (e) {
      var index = $(e.currentTarget).index();
      this.goto(index);
      e.preventDefault();
    },
  }
};

Backbone.hammerOptions = {
  prevent_default: false
}

var PreloadView = Backbone.View.extend({
  initialize: function (opts) {
    this.$el.fadeIn();
    this.l = opts.l;
    this.count = 0;
  },
  update: function () {
    this.count++;
    var p = (this.count / this.l) * 100;

    this.$el.css('width', p + '%');
    if (p === 100) {
      this.$el.fadeOut(2000);
    }
  }
});

var SliderView = Backbone.View.extend({
  initialize: function (opts) {
    opts = opts || {};

    this.showNav = (opts.showNav !== undefined) ? opts.showNav : true;
    this.oneAtATime = (opts.oneAtATime !== undefined) ? opts.oneAtATime : false;
    this.minHeight = (opts.minHeight !== undefined) ? opts.minHeight : undefined;

    this.updateHeight = opts.updateHeight || false;
    this.$overflow = this.$el.find('ul.overflow');
    this.$slides = this.$overflow.find('li.slide');
    this.idx = 0;
    this.slideGroup = opts.slideGroup || 4;

    this.setMax();
    this.len = this.$slides.length;
    this.mobileGroup = opts.mobileGroup || false;
    this.desktopGroup = opts.desktopGroup || false;
    this.defaultGroup = this.slideGroup;
    this.leftAlign = opts.leftAlign ? opts.leftAlign : false;

    var deferred = this.$el.imagesLoaded();
    deferred.always(_.bind(this.render, this));

    /* Add a preloader */
    if (opts.preload) {
      var $preloader = $("<div class='loading-bar'>").appendTo(this.$el);
      this.pv = new PreloadView({el: $preloader, l: this.len});
    }

    deferred.progress(_.bind(this.progress, this));

    this.guid = 'slider-'+window.Born.guid();

    $(window).on('resize.'+this.guid, _.debounce(_.bind(this.resize, this)));

    if (opts.duration !== undefined && !Born.mobile) {
      /* Setup Timer*/
      this.duration = opts.duration;
      this.initTimer();

      /* This is bound to all sliders. it is a bug becuase events is local to the page. needs a good fix once logic is fully laid out  */
      var self = this;
      this.$el.on('mouseenter.slider', function () {
        self.goto(this.idx);
        if (self.interval && (self.duration !== undefined)) {
          self.stopTimer();
        }
      });

      this.$el.on('mousemove.slider', function () {
        if (self.interval && (self.duration !== undefined)) {
          self.stopTimer();
        }        
      });

      this.$el.on('mouseleave.slider', function () {
        if (self.duration !== undefined) {
          self.resetTimer();
        }
      });
    }
  },
  progress: function () {
    if (this.pv) {
      this.pv.update()
    }
  },
  setMax: function () {
    if (!this.oneAtATime) {
      this.max = Math.ceil( this.$slides.length / this.slideGroup ) - 1;
    } else {
      this.max = this.$slides.length - this.slideGroup;
      if (this.max < 0) {
        this.max = 0;
      }
    }
  },
  resize: function () {
    if(this.mobileGroup || this.desktopGroup) {

      if(this.$el.width() <= parseInt(Born.Breakpoints.mobile) && (this.slideGroup != this.mobileGroup)) {
        this.slideGroup = this.mobileGroup;
        this.rebuild();
      } else if (
        (this.$el.width() > parseInt(Born.Breakpoints.mobile)) &&
        (this.$el.width() <= parseInt(Born.Breakpoints.desktop)) &&
        (this.slideGroup != this.defaultGroup)) {
        this.slideGroup = this.defaultGroup;
        this.rebuild();
      } else if (this.$el.width() > parseInt(Born.Breakpoints.desktop) && this.slideGroup != this.desktopGroup) {
        this.slideGroup = this.desktopGroup;
        this.rebuild();
      }
    }

    if (this.$el.find('.frame')[0]) {
      console.log(this.$el.find('.frame'));
      this.width = Math.ceil( this.$el.find('.frame').width() / this.slideGroup);
    } else {
      this.width = Math.ceil( this.$el.width() / this.slideGroup);
    }

    this.$slides.width(this.width);
    this.setHeight();

    this.$overflow.css('left', -this.width * this.idx);

    var w = 0;
    this.$slides.each(function () {
      w += $(this).outerWidth();
    });

    this.$overflow.css('width', w);

    if (((this.len <= this.slideGroup) || (this.len === 1) ) && !this.leftAlign) {
      console.log(this.leftAlign);
      var w = this.$overflow.width();
      var ww = this.$el.width();
      this.$overflow.css('left', (ww - w) / 2);
    }
  },
  setHeight: function () {
    var max_h = -10000;

    this.$slides.each(function () {
      $(this).css('height', '');

      var h = $(this).outerHeight();
      if (h > max_h) {
        max_h = h;
      }
    });

    /* Vertically Responsive */
    if (this.updateHeight) {
      if ((this.minHeight !== undefined) && (max_h < this.minHeight)) {
        max_h = this.minHeight;
      }
      this.$el.css('height', max_h);
    }

    this.height = max_h;
  },
  rebuild: function (){
    if (this.$nav) {
      this.$nav.remove();
    }
    if (this.$arrows) {
      this.$arrows.remove();
    }
    if (this.showNav) {
      this.buildNav();
    }
    if (this.showArrows) {
      this.buildArrows();
    }
    this.setMax();
    this.goto(0);
  },
  buildNav: function () {
    if (this.len <= this.slideGroup || (this.len === 1)) { this.goto(0); return; }
    this.setMax();
    var $nav = $("<ul class='nav'>");
    
    for(var i = 0; i <= this.max; i++){
      var $li = $("<li>");
      $nav.append($li);
    }

    // this.$slides.each(function () {
    //   var $li = $('<li>');
    //   $nav.append($li);
    // });

    this.$el.append($nav);
    this.$nav = $nav;
  },
  buildArrows: function () {
    if (this.len <= this.slideGroup) { this.goto(0); return }

    this.$arrows = $(ArrowsTemplate).appendTo(this.$el);
  },
  render: function () {
    this.setHeight();

    if (this.showArrows) {
      this.buildArrows();
    }

    if (this.showNav) {
      this.buildNav();
    }
    this.goto();

    this.resize();
    if (window.Born.mobile) {
      this.$overflow.css({opacity: 1});
    } else {
      this.$overflow.animate({opacity: 1});
    }
  },
  next: function () {
    console.log('next');
    console.log(this.idx);
    console.log(this.max);
    if (this.idx === this.max) {
      this.idx = -1;
    }
    this.goto(this.idx + 1);
  },
  prev: function () {
    if (this.idx === 0) {
      this.idx = this.max + 1;
    }
    this.goto(this.idx - 1);
  },
  activate: function () {
    if (!this.$nav) return;

    var $markers = this.$nav.find('li');
    $markers.removeClass('active');
    $($markers[this.idx]).addClass('active');
  },
  goto: function (i) {
    this.idx = _.isUndefined(i) ? this.idx : i;

    if (this.idx < 0) {
      this.idx = 0;
    }
    if (this.idx > this.max)  {
      this.idx = this.max;
    }

    if(typeof this.width =='undefined'){
      this.width = $(this.$slides[this.idx]).width();
    }

    var w;
    if (this.oneAtATime) {
      w = this.width;
    } else {
      w = this.width*this.slideGroup;
    }

    this.$overflow.css({left: -this.idx * w}, 750);
    //this.$overflow.css('left', -this.idx * this.width);

    this.$cur = $(this.$slides[this.idx]);
    this.$slides.removeClass('active');
    this.$cur.addClass('active');

    this.activate();
  },
  initTimer: function () {
    this.startTimer();
  },
  resetTimer: function () {
    this.stopTimer();
    this.startTimer();
  },
  stopTimer: function () {
    clearInterval(this.interval);
  },
  startTimer: function () {
    var self = this;
    this.interval = setInterval(function () {
      self.next();
    }, this.duration);
  },
  destroy: function () {
    console.log('destroying slider');

    if (this.showArrows) {
      this.$arrows.remove();
    }

    if (this.showNav) {
      this.$nav.remove();
    }

    $(window).off('resize.'+this.guid);

    // COMPLETELY UNBIND THE VIEW
    this.undelegateEvents();
    this.$el.removeData().unbind(); 

    return null;
  },
  events: Born.mobile ? events.mobile : events.desktop,
  hammerEvents: {
    'swipeleft': 'next',
    'swiperight': 'prev'
  }
});

return SliderView;

});