var _ = require('underscore'),
  $ = require('jquery'),
  VersalSanitize = require('../scripts/versal.sanitize');

var sanitizationOptions = {
  elements:   [
    'b', 'i', 'u',
    'strong', //todo, remove them
    'em',     //todo, remove them
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ol', 'ul', 'li',
    'blockquote',
    'a',
    'p',
    'font',
    'br'    //for converting the old plain text gadget
  ],
  attributes: {
    a: ['href', 'target', 'title'],
    font: ['face']
  },
  protocols:  {
    a: { href: ['http', 'https', 'mailto'] }
  }
};

describe("Configuration for text gadget - Test one part of sanitization - whitelist HTML tags based on regex", function(){

  describe("removeTags()", function(){
    it('should remove <script> tag', function(){
      var input = "test<script>alert('hello');</script>";
      var output = VersalSanitize.removeTags(input, sanitizationOptions);
      expect(output).to.equal("testalert('hello');");
    });

    it('should remove <img> tag', function(){
      var input = "test<img src=' http://static.jquery.com/files/rocker/images/logo_jquery_215x53.gif' onload='alert(\"hi there\")'>";
      var output = VersalSanitize.removeTags(input, sanitizationOptions);
      expect(output).to.equal('test');
    });

    it('should remove <span> tag', function(){
      var input = "test<span class='test1'></span>";
      var output = VersalSanitize.removeTags(input, sanitizationOptions);
      expect(output).to.equal('test');
    });

    it('should remove <div> tag', function(){
      var input = "test<div class='test2'></div>";
      var output = VersalSanitize.removeTags(input, sanitizationOptions);
      expect(output).to.equal('test');
    });

    it('should remove <ulrandom> tags', function(){
      var input = "test<ulrandom class='test2'></ulrandom>";
      var output = VersalSanitize.removeTags(input, sanitizationOptions);
      expect(output).to.equal('test');
    });

    it('should remove all tags that is NOT in the whitelist', function(){
      //http://stackoverflow.com/questions/2439374/where-to-find-a-list-of-all-the-possible-html-tags-in-python
      var allTags = ["a","abbr","acronym","address","area","b","base","bdo","big","blockquote","body","br","button","caption","cite","code","col","colgroup","dd","del","dfn","div","dl","DOCTYPE","dt","em","fieldset","form","h1","h2","h3","h4","h5","h6","head","html","hr","i","img","input","ins","kbd","label","legend","li","link","map","meta","noscript","object","ol","optgroup","option","p","param","pre","q","samp","script","select","small","span","strong","style","sub","sup","table","tbody","td","textarea","tfoot","th","thead","title","tr","tt","ul","var"];
      var whitelist = sanitizationOptions.elements;
      var otherTags = _.difference(allTags, whitelist);
      var input;
      _.each(otherTags, function(tag){
        input = "test<" + tag + " class='test' title='title'>content</" + tag + ">";
        output = VersalSanitize.removeTags(input, sanitizationOptions);
        expect(output).to.equal('testcontent');
      });
    });

    it('should NOT remove whitelisted tags', function(){
      var tags = sanitizationOptions.elements;
      var input, output;
      _.each(tags,function(tag){
        input = "test<" + tag + " class='test' title='title'>content</" + tag + ">";
        output = VersalSanitize.removeTags(input, sanitizationOptions);
        expect(output).to.equal(input);
      });
    });
  });


  describe("removeAttrs()", function(){
    it('should remove attributes from <b> tag', function(){
      var input = "test<b class='test'>content</b>";
      var output = VersalSanitize.removeAttrs(input, sanitizationOptions);
      expect(output).to.equal('test<b>content</b>');
    });

    it('should remove attributes from <i> tag', function(){
      var input = "test<i class='test'>content</i>";
      var output = VersalSanitize.removeAttrs(input, sanitizationOptions);
      expect(output).to.equal('test<i>content</i>');
    });

    it('should remove attributes from <u> tag', function(){
      var input = "test<u class='test'>content</u>";
      var output = VersalSanitize.removeAttrs(input, sanitizationOptions);
      expect(output).to.equal('test<u>content</u>');
    });

    //generalized
    it('should remove all attributes from all tags expect <a> and <font>', function(){
      var tags = _.reject(sanitizationOptions.elements, function(item){
        return (item === 'a' || item === 'font');
      });
      var input, output;
      _.each(tags,function(tag){
        input = "test<" + tag + " class='test' title='title'>content</" + tag + ">";
        output = VersalSanitize.removeAttrs(input, sanitizationOptions);
        expect(output).to.equal("test<" + tag + ">content</" + tag + ">");
      });
    });

    it('should NOT remove <a href>', function(){
      var input = "test<a href='test'>testLink</a>";
      var output = VersalSanitize.removeAttrs(input, sanitizationOptions);
      expect(output).to.equal(input);
    });
    it('should NOT remove <a> with multi attributes', function(){
      var input = "test<a href='test' target='_blank' title='test' test1='adfsaf'>testLink</a>";
      var output = VersalSanitize.removeAttrs(input, sanitizationOptions);
      expect(output).to.equal(input);
    });
    it('should NOT remove <font face>', function(){
      var input = "test<font face='Avenir'>test</font>";
      var output = VersalSanitize.removeAttrs(input, sanitizationOptions);
      expect(output).to.equal(input);
    });

  });


  describe("removeAttrsEndTags()", function(){
    it('should remove attributes from <b> end tag', function(){
      var input = "test<b>content</b class='test'>";
      var output = VersalSanitize.removeAttrsEndTags(input, sanitizationOptions);
      expect(output).to.equal('test<b>content</b>');
    });

    it('should remove attributes from <i> end tag', function(){
      var input = "test<i>content</i  class='test'>";
      var output = VersalSanitize.removeAttrsEndTags(input, sanitizationOptions);
      expect(output).to.equal('test<i>content</i>');
    });

    it('should remove attributes from <u> end tag', function(){
      var input = "test<u>content</u  class='test'>";
      var output = VersalSanitize.removeAttrsEndTags(input, sanitizationOptions);
      expect(output).to.equal('test<u>content</u>');
    });

    //generalized
    it('should remove all attributes from all end tags', function(){
      var tags = sanitizationOptions.elements;
      var input, output;
      _.each(tags,function(tag){
        input = "test<" + tag + ">content</ " + tag + "  class='test' title='title'>";
        output = VersalSanitize.removeAttrsEndTags(input, sanitizationOptions);
        expect(output).to.equal("test<" + tag + ">content</" + tag + ">");
      });
    });

  });

  describe("keepAttrs()", function(){
    it('should keep <a href> with single quote', function(){
      var input = "test<a href='test'>testLink</a>";
      var output = VersalSanitize.keepAttrs(input, sanitizationOptions);
      expect(output).to.equal(input);
    });
    it('should keep <a href> with double quotes', function(){
      var input = 'test<a href="test">testLink</a>';
      var output = VersalSanitize.keepAttrs(input, sanitizationOptions);
      expect(output).to.equal(input);
    });

    it('should keep <a target> with single quote', function(){
      var input = "test<a target='_blank'>testLink</a>";
      var output = VersalSanitize.keepAttrs(input, sanitizationOptions);
      expect(output).to.equal(input);
    });
    it('should keep <a target> with double quotes', function(){
      var input = 'test<a target="_blank">testLink</a>';
      var output = VersalSanitize.keepAttrs(input, sanitizationOptions);
      expect(output).to.equal(input);
    });

    it('should keep <a title> with single quote', function(){
      var input = "test<a title='http://test.com'>testLink</a>";
      var output = VersalSanitize.keepAttrs(input, sanitizationOptions);
      expect(output).to.equal(input);
    });
    it('should keep <a title> with double quotes', function(){
      var input = 'test<a title="http://test.com">testLink</a>';
      var output = VersalSanitize.keepAttrs(input, sanitizationOptions);
      expect(output).to.equal(input);
    });

    it('should keep <a href target>', function(){
      var input = "test<a href='test' target='_blank'>testLink</a>";
      var output = VersalSanitize.keepAttrs(input, sanitizationOptions);
      expect(output).to.equal(input);
    });
    it('should keep <a href title>', function(){
      var input = "test<a href='test' title='test'>testLink</a>";
      var output = VersalSanitize.keepAttrs(input, sanitizationOptions);
      expect(output).to.equal(input);
    });
    it('should keep <a href target title> tag', function(){
      var input = "test<a href='test' target='_blank' title='test'>testLink</a>";
      var output = VersalSanitize.keepAttrs(input, sanitizationOptions);
      expect(output).to.equal(input);
    });
    it('should ONLY keep <a href target title> tag', function(){
      var input = "test<a href='test' target='_blank' title='test' test1='adfsaf'>testLink</a>";
      var output = VersalSanitize.keepAttrs(input, sanitizationOptions);
      expect(output).to.equal("test<a href='test' target='_blank' title='test'>testLink</a>");
    });

    //warning
    //removing href without quotes
    //might be problematic
    it('should REMOVE <a href> with no quote', function(){
      var input = "test<a href=test>testLink</a>";
      var output = VersalSanitize.keepAttrs(input, sanitizationOptions);
      expect(output).to.equal("test<a >testLink</a>");
    });
    it('should REMOVE attributes except <a href target title> ', function(){
      var input = "test<a href='test' target='_blank' title='test' test1='adfsaf' title2='title2'>testLink</a>";
      var output = VersalSanitize.keepAttrs(input, sanitizationOptions);
      expect(output).to.equal("test<a href='test' target='_blank' title='test'>testLink</a>");
    });

  });

  describe("Combined function - whiteListTagsFull() - NOTE NOT the same as whiteListTags()", function(){

    it('should remove script tag', function(){
      var input = "test<script>alert('hello');</script>";
      var output = VersalSanitize.whiteListTagsFull(input, sanitizationOptions);
      expect(output).to.equal("testalert('hello');");
    });

    it('should remove image tag', function(){
      var input = "test<img src=' http://static.jquery.com/files/rocker/images/logo_jquery_215x53.gif' onload='alert(\"hi there\")'>";
      var output = VersalSanitize.whiteListTagsFull(input, sanitizationOptions);
      expect(output).to.equal('test');
    });

    it('should remove tag attributes from start tags', function(){
      var input = "test<b src=' http://static.jquery.com/files/rocker/images/logo_jquery_215x53.gif' onload='alert(\"hi there\")'>";
      var output = VersalSanitize.whiteListTagsFull(input, sanitizationOptions);
      expect(output).to.equal('test<b>');
    });
    it('should remove tag attributes from end tags', function(){
      var input = "test<b>bold</b src=' http://static.jquery.com/files/rocker/images/logo_jquery_215x53.gif' onload='alert(\"hi there\")'>";
      var output = VersalSanitize.whiteListTagsFull(input, sanitizationOptions);
      expect(output).to.equal('test<b>bold</b>');
    });

    it('should save a[href] tag', function(){
      var input = "test<a href ='test.com'>";
      var output = VersalSanitize.whiteListTagsFull(input, sanitizationOptions);
      expect(output).to.equal(input);
    });

    it('should save a[title] tag', function(){
      var input = "test<a title ='test.com'>";
      var output = VersalSanitize.whiteListTagsFull(input, sanitizationOptions);
      expect(output).to.equal(input);
    });

    it('should save a[target] tag', function(){
      var input = "test<a target ='_blank'>";
      var output = VersalSanitize.whiteListTagsFull(input, sanitizationOptions);
      expect(output).to.equal(input);
    });

    it('should save a[href, title, target] tag', function(){
      var input = "test<a href='http://www.go.com' title='go.com' target ='_blank'>";
      var output = VersalSanitize.whiteListTagsFull(input, sanitizationOptions);
      expect(output).to.equal(input);
    });

    it('should remove other tags', function(){
      var expected = "test<a href='http://www.go.com' title='go.com' target ='_blank'>";
      var input = "test<a href='http://www.go.com' title='go.com' target ='_blank' t1='other1' title2='title2'>";
      var output = VersalSanitize.whiteListTagsFull(input, sanitizationOptions);
      expect(output).to.equal(expected);
    });

    it('should save font[face] tag', function(){
      var input = "test<font face ='Avenir'>";
      var output = VersalSanitize.whiteListTagsFull(input, sanitizationOptions);
      expect(output).to.equal(input);
    });

    it('should remove font[other, others, faces] tag', function(){
      var expected = "test<font face ='Avenir'>";
      var input = "test<font face ='Avenir' other='other' others='others' faces='faces'>";
      var output = VersalSanitize.whiteListTagsFull(input, sanitizationOptions);
      expect(output).to.equal(expected);
    });

    it('should remove other tags', function(){
      var expected = "test<font face ='Avenir'>fontcontent</font><a href='http://www.go.com' title='go.com' target ='_blank'>acontent</a>";
      var input = "test<font face ='Avenir' other='other' others='others' faces='faces'>fontcontent</font><a href='http://www.go.com' title='go.com' target ='_blank' other='other'>acontent</a>";
      var output = VersalSanitize.whiteListTagsFull(input, sanitizationOptions);
      expect(output).to.equal(expected);
    });

    it('should remove other tags even if they are nested', function(){
      var expected = "test<font face ='Avenir'>fontcontent</font><a href='http://www.go.com' title='go.com' target ='_blank'>acontent</a>";
      var input = "test<font face ='Avenir' other='other' others='others' faces='faces'>fontcontent</font><a href='http://www.go.com' title='go.com' target ='_blank' other='other'>acontent</a><div><div><span></span><span></span></div></div>";
      var output = VersalSanitize.whiteListTagsFull(input, sanitizationOptions);
      expect(output).to.equal(expected);
    });

  });


});

