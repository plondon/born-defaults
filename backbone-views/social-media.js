// View for creating basic social media functionality

// Requires
// - backbone

// Usage
// this.smv = new SocialMediaView({el: $('.social') });

define([
'jquery',
'underscore',
'backbone'], function ($, _, Backbone) {

"use strict";

var SocialMediaView = Backbone.View.extend({
  initialize: function (opts) {
    this.image = opts.image;
    this.href = opts.href ? opts.href : window.location.href;
    // this in only for a case where the image has a different url
    this.hrefPinterest = opts.hrefPinterest || this.href;

    $('head').append('<meta property="og:image" content="' + window.location.host + this.image + '"/>');
  },
  events: {
    'click .fb': function (e) {
      var url = encodeURI('http://www.facebook.com/sharer.php?u='+this.href+'&p[images][0]='+encodeURIComponent(this.image));
      var nw = window.open(url, 'share', 'height=375,width=650');
      if (window.focus) { nw.focus(); }
      e.preventDefault();
    },
    'click .tw': function (e) {
      var url = encodeURI('https://twitter.com/share?url='+this.href);
      var nw = window.open(url, 'share', 'height=375,width=650');
      if (window.focus) { nw.focus(); }
      e.preventDefault();
    },
    'click .pn': function (e) {
      var image = $('.main-image').attr('href');
      if(typeof image == 'undefined'){
        image = $('.img-main').find('img.bkg-img').attr('src');
      }
      var description = $('h1.product-name').first().text();
      var href = window.location.host + window.location.pathname;
      var url = encodeURI("http://pinterest.com/pin/create/button/?url=" + href + "&description=" + description + "&media="+image);

      var nw = window.open(url, 'share', 'height=375,width=650');
      if (window.focus) { nw.focus(); }
      e.preventDefault();
    },
    'click .gp': function (e) {
      var image = this.image || $('.main-image').find('img.fg').attr('src');
      var url = encodeURI("https://plus.google.com/share?url="+this.href);
      var nw = window.open(url, '', 'menubar=no,toolbar=no,resizable=yes,scrollbars=yes,height=600,width=600');
      if (window.focus) { nw.focus(); }
      e.preventDefault();
    }
  }
});

return SocialMediaView;

});