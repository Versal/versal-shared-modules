/* global define, expect, it, describe, beforeEach, afterEach*/

define(
["scripts/lib/versal.sanitize", "cdn.jquery"],
function(VersalSanitize, $){

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

});
