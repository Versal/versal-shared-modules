/* global define, expect, it, describe, beforeEach, afterEach*/

define(
["scripts/lib/versal.sanitize", "cdn.jquery", "cdn.underscore"],
function(VersalSanitize, $, _){

  var sanitizationRules = {
    elements:   [
      'a',
      'iframe'
    ],
    attributes: {
      a: ['href', 'target', 'title'],
      iframe: ['style', 'src', 'seamless', 'width', 'height', 'scrolling', 'frameborder']
    },
    protocols:  {
      a: { href: ['http', 'https'] }
    }
  };

  var san = function(input){
    return VersalSanitize.sanitize.call(this, input, sanitizationRules);
  };

  describe("Configuration for sound iframe gadget - Test against common XSS", function(){

    it('should remove image tag', function(){
      var input = "test<img src=' http://static.jquery.com/files/rocker/images/logo_jquery_215x53.gif' onload='alert(\"hi there\")'>";
      var output = san(input);
      expect(output).to.equal('test');
    });

    it('should remove script tag', function(){
      var input = "test<script>alert('Hi!'');</script>";
      var output = san(input);
      expect(output).to.equal('testalert(\'Hi!\'\');');
    });

    it('should remove malformatted a tag version 1', function(){
      var input = "test<a href=javascript:(alert('oh no'))>CLICK HERE FOR FREE CAR!</a>";
      var output = san(input);
      expect(output).to.equal('test<a>CLICK HERE FOR FREE CAR!</a>');
    });

    it('should remove malformatted a tag version 2', function(){
      var input = "test<a href='javascript:(alert(1))'>CLICK HERE FOR FREE CAR!</a>";
      var output = san(input);
      expect(output).to.equal('test<a>CLICK HERE FOR FREE CAR!</a>');
    });

    it('should remove incomplete a tag', function(){
      var input = 'test<a href=">" onmouseover="attackCode()">';
      var output = san(input);
      expect(output).to.equal('test<a></a>');
    });

  });

  var compareIframe = function(from, to, attrs){
    var $from = $(from),
        $to   = $(to);

    attrs = attrs || ['width', 'height', 'scrolling', 'frameborder', 'src'];

    _.each(attrs, function(attr){
      expect($from.attr(attr)).to.not.be.undefined;
      expect($from.attr(attr)).to.equal($to.attr(attr));
    });
  };

  describe("Configuration for sound iframe gadget - Test against iframe code", function(){
    it('should deal with soundcloud long embed code', function(){
      var input = '<iframe width="100%" height="450" scrolling="no" frameborder="no" src="https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/138258333&amp;auto_play=false&amp;hide_related=false&amp;visual=true"></iframe>';
      var output = san(input);
      compareIframe(input, output, ['width', 'height', 'scrolling', 'frameborder', 'src']);
    });

    it('should deal with soundcloud medium embed code', function(){
      var input = '<iframe width="100%" height="166" scrolling="no" frameborder="no" src="https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/138258333&amp;color=ff5500&amp;auto_play=false&amp;hide_related=false&amp;show_artwork=true"></iframe>';
      var output = san(input);
      compareIframe(input, output, ['width', 'height', 'scrolling', 'frameborder', 'src']);
    });

    it('should deal with bandcamp long embed code', function(){
      var input = '<iframe style="border: 0; width: 350px; height: 470px;" src="http://bandcamp.com/EmbeddedPlayer/album=4052180322/size=large/bgcol=ffffff/linkcol=0687f5/tracklist=false/transparent=true/" seamless><a href="http://akt1.bandcamp.com/album/soundtrack-pour-une-r-volution-de-pierre-cl-menti">Soundtrack Pour Une Révolution De Pierre Clémenti by AKT¡!</a></iframe>';
      var output = san(input);
      compareIframe(input, output, ['style', 'src', 'seamless']);
    });

    it('should deal with bandcamp medium embed code', function(){
      var input = '<iframe style="border: 0; width: 100%; height: 120px;" src="http://bandcamp.com/EmbeddedPlayer/album=4052180322/size=large/bgcol=ffffff/linkcol=0687f5/tracklist=false/artwork=small/transparent=true/" seamless><a href="http://akt1.bandcamp.com/album/soundtrack-pour-une-r-volution-de-pierre-cl-menti">Soundtrack Pour Une Révolution De Pierre Clémenti by AKT¡!</a></iframe>';
      var output = san(input);
      compareIframe(input, output, ['style', 'src', 'seamless']);
    });

    it('should deal with bandcamp short embed code', function(){
      var input = '<iframe style="border: 0; width: 100%; height: 42px;" src="http://bandcamp.com/EmbeddedPlayer/album=4052180322/size=small/bgcol=ffffff/linkcol=0687f5/transparent=true/" seamless><a href="http://akt1.bandcamp.com/album/soundtrack-pour-une-r-volution-de-pierre-cl-menti">Soundtrack Pour Une Révolution De Pierre Clémenti by AKT¡!</a></iframe>';
      var output = san(input);
      compareIframe(input, output, ['style', 'src', 'seamless']);
    });

  });

});
