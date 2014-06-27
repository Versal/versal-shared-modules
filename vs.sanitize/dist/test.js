(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 * Copyright (c) 2010 by Gabriel Birke
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the 'Software'), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

function Sanitize(){
  var i, e, options;
  options = arguments[0] || {};
  this.config = {};
  this.config.elements = options.elements ? options.elements : [];
  this.config.attributes = options.attributes ? options.attributes : {};
  this.config.attributes[Sanitize.ALL] = this.config.attributes[Sanitize.ALL] ? this.config.attributes[Sanitize.ALL] : [];
  this.config.allow_comments = options.allow_comments ? options.allow_comments : false;
  this.allowed_elements = {};
  this.config.protocols = options.protocols ? options.protocols : {};
  this.config.add_attributes = options.add_attributes ? options.add_attributes  : {};
  this.dom = options.dom ? options.dom : document;
  for(i=0;i<this.config.elements.length;i++) {
    this.allowed_elements[this.config.elements[i]] = true;
  }
  this.config.remove_element_contents = {};
  this.config.remove_all_contents = false;
  if(options.remove_contents) {

    if(options.remove_contents instanceof Array) {
      for(i=0;i<options.remove_contents.length;i++) {
        this.config.remove_element_contents[options.remove_contents[i]] = true;
      }
    }
    else {
      this.config.remove_all_contents = true;
    }
  }
  this.transformers = options.transformers ? options.transformers : [];
}

Sanitize.REGEX_PROTOCOL = /^([A-Za-z0-9\+\-\.\&\;\*\s]*?)(?:\:|&*0*58|&*x0*3a)/i;
Sanitize.RELATIVE = '__relative__'; // emulate Ruby symbol with string constant

Sanitize.prototype.clean_node = function(container) {
  var fragment = this.dom.createDocumentFragment();
  this.current_element = fragment;
  this.whitelist_nodes = [];



  /**
   * Utility function to check if an element exists in an array
   */
  function _array_index(needle, haystack) {
    var i;
    for(i=0; i < haystack.length; i++) {
      if(haystack[i] == needle)
        return i;
    }
    return -1;
  }

  function _merge_arrays_uniq() {
    var result = [];
    var uniq_hash = {};
    var i,j;
    for(i=0;i<arguments.length;i++) {
      if(!arguments[i] || !arguments[i].length)
        continue;
      for(j=0;j<arguments[i].length;j++) {
        if(uniq_hash[arguments[i][j]])
          continue;
        uniq_hash[arguments[i][j]] = true;
        result.push(arguments[i][j]);
      }
    }
    return result;
  }

  /**
   * Clean function that checks the different node types and cleans them up accordingly
   * @param elem DOM Node to clean
   */
  function _clean(elem) {
    var clone;
    switch(elem.nodeType) {
      // Element
      case 1:
        _clean_element.call(this, elem);
        break;
      // Text
      case 3:
        clone = elem.cloneNode(false);
        this.current_element.appendChild(clone);
        break;
      // Entity-Reference (normally not used)
      case 5:
        clone = elem.cloneNode(false);
        this.current_element.appendChild(clone);
        break;
      // Comment
      case 8:
        if(this.config.allow_comments) {
          clone = elem.cloneNode(false);
          this.current_element.appendChild(clone);
        }
        break;
      default:
        if (console && console.log) console.log("unknown node type", elem.nodeType);
        break;
    }

  }

  function _clean_element(elem) {
    var i, j, clone, parent_element, name, allowed_attributes, attr, attr_name, attr_node, protocols, del, attr_ok;
    var transform = _transform_element.call(this, elem);

    elem = transform.node;
    name = elem.nodeName.toLowerCase();

    // check if element itself is allowed
    parent_element = this.current_element;
    if(this.allowed_elements[name] || transform.whitelist) {
        this.current_element = this.dom.createElement(elem.nodeName);
        parent_element.appendChild(this.current_element);

      // clean attributes
      var attrs = this.config.attributes;
      allowed_attributes = _merge_arrays_uniq(attrs[name], attrs['__ALL__'], transform.attr_whitelist);
      for(i=0;i<allowed_attributes.length;i++) {
        attr_name = allowed_attributes[i];
        attr = elem.attributes[attr_name];
        if(attr) {
            attr_ok = true;
            // Check protocol attributes for valid protocol
            if(this.config.protocols[name] && this.config.protocols[name][attr_name]) {
              protocols = this.config.protocols[name][attr_name];
              del = attr.nodeValue.toLowerCase().match(Sanitize.REGEX_PROTOCOL);
              if(del) {
                attr_ok = (_array_index(del[1], protocols) != -1);
              }
              else {
                attr_ok = (_array_index(Sanitize.RELATIVE, protocols) != -1);
              }
            }
            if(attr_ok) {
              attr_node = document.createAttribute(attr_name);
              attr_node.value = attr.nodeValue;
              this.current_element.setAttributeNode(attr_node);
            }
        }
      }

      // Add attributes
      if(this.config.add_attributes[name]) {
        for(attr_name in this.config.add_attributes[name]) {
          attr_node = document.createAttribute(attr_name);
          attr_node.value = this.config.add_attributes[name][attr_name];
          this.current_element.setAttributeNode(attr_node);
        }
      }
    } // End checking if element is allowed
    // If this node is in the dynamic whitelist array (built at runtime by
    // transformers), let it live with all of its attributes intact.
    else if(_array_index(elem, this.whitelist_nodes) != -1) {
      this.current_element = elem.cloneNode(true);
      // Remove child nodes, they will be sanitiazied and added by other code
      while(this.current_element.childNodes.length > 0) {
        this.current_element.removeChild(this.current_element.firstChild);
      }
      parent_element.appendChild(this.current_element);
    }

    // iterate over child nodes
    if(!this.config.remove_all_contents && !this.config.remove_element_contents[name]) {
      for(i=0;i<elem.childNodes.length;i++) {
        _clean.call(this, elem.childNodes[i]);
      }
    }

    // some versions of IE don't support normalize.
    if(this.current_element.normalize) {
      this.current_element.normalize();
    }
    this.current_element = parent_element;
  } // END clean_element function

  function _transform_element(node) {
    var output = {
      attr_whitelist:[],
      node: node,
      whitelist: false
    };
    var i, j, transform;
    for(i=0;i<this.transformers.length;i++) {
      transform = this.transformers[i]({
        allowed_elements: this.allowed_elements,
        config: this.config,
        node: node,
        node_name: node.nodeName.toLowerCase(),
        whitelist_nodes: this.whitelist_nodes,
        dom: this.dom
      });
      if (transform == null)
        continue;
      else if(typeof transform == 'object') {
        if(transform.whitelist_nodes && transform.whitelist_nodes instanceof Array) {
          for(j=0;j<transform.whitelist_nodes.length;j++) {
            if(_array_index(transform.whitelist_nodes[j], this.whitelist_nodes) == -1) {
              this.whitelist_nodes.push(transform.whitelist_nodes[j]);
            }
          }
        }
        output.whitelist = transform.whitelist ? true : false;
        if(transform.attr_whitelist) {
          output.attr_whitelist = _merge_arrays_uniq(output.attr_whitelist, transform.attr_whitelist);
        }
        output.node = transform.node ? transform.node : output.node;
      }
      else {
        throw new Error("transformer output must be an object or null");
      }
    }
    return output;
  }



  for(i=0;i<container.childNodes.length;i++) {
    _clean.call(this, container.childNodes[i]);
  }

  if(fragment.normalize) {
    fragment.normalize();
  }

  return fragment;

};

module.exports = Sanitize;

},{}],2:[function(require,module,exports){
var _ = (window._),
  $ = (window.$),
  Sanitize = require('./sanitize');

var VS = {};

VS.sanitize = function(input, rules){
  var configHtmlRegexed = VS.whiteListTags(input, rules);
  var configHtmlNode = VS.stripScripts(configHtmlRegexed);
  var sanitizedConfigHtml = VS.sanitizeHTML(configHtmlNode, rules);
  return sanitizedConfigHtml;
};


//step 1
//sanitization based on regex
//note this is only the first round of sanitization
//so perfection is not necessary
//a lib can be also used
//https://code.google.com/p/jquery-clean/source/browse/trunk/jquery.htmlClean.js
//ref for some common regex
//http://www.pagecolumn.com/tool/all_about_html_tags.htm
//test regex here http://regex101.com/
VS.whiteListTags = function(input, options){
  //remove tags except the whitelisted ones
  var tagsRemoved = VS.removeTags(input, options);

  //remove attributes for end tags
  var attrsRemovedEndTags = VS.removeAttrsEndTags(tagsRemoved, options);

  return attrsRemovedEndTags;
};

VS.removeTags = function(input, options){
  //whitelist tags
  //http://stackoverflow.com/questions/10360317/whitelist-javascript-to-strip-html-tags
  var els = options.elements;
  //(?!) is a negative lookahead
  //(\/\s*)? - an optional slash
  //this matches all unknown tags
  var output, flag;

  var filtered = input.replace(/<([^>]+)>/ig, function(match, p1){
    output = /(?:\/\s*)?(\w+)/ig.exec(p1) || [];  //get html tagname
    if(output.length >= 2) {
      flag = _.contains(els, output[1].toLowerCase());  //second element is the html tagname
      return (flag ? match : ''); //either keep tag intact or replace it completely
    } else {
      return '';
    }
  });

  return filtered;
};

//for end tags
VS.removeAttrsEndTags = function(input, options){
  var els = options.elements;
  var output, flag;

  var filtered = input.replace(/<\s*\/([^>]+)>/ig, function(match, p1){
    output = /\s*(\w+)/ig.exec(p1) || [];  //get html tagname
    if(output.length >= 2) {
      flag = _.contains(els, output[1].toLowerCase());  //second element is the html tagname
      return (flag ? '</' + output[1] + '>' : ''); //either keep tag intact or replace it completely
    } else {
      return '';
    }
  });

  return filtered;
};


//step 2
//most likely no use
//but just in case
//sanitization
//http://stackoverflow.com/questions/6659351/removing-all-script-tags-from-html-with-js-regular-expression/21616257#21616257
VS.stripScripts = function (s) {
  var div = document.createElement('div');
  div.innerHTML = s;
  var scripts = div.getElementsByTagName('script');
  var i = scripts.length;
  while (i--) {
    scripts[i].parentNode.removeChild(scripts[i]);
  }
  return div;
};


//step 3
VS.sanitizeHTML = function(input, rules){
  //instantize Sanitize based on rules
  var sanitizeDom = new Sanitize(rules);

  //input is a DOM node, NOT a string
  //outputHTML is a string
  var output = sanitizeDom.clean_node(input);

  var outputHTML = $('<div></div>').append(output).html();
  return outputHTML;
};

//optional sanitization functions
VS.whiteListTagsFull = function(input, options){
  //remove tags except the whitelisted ones
  var tagsRemoved = VS.removeTags(input, options);

  //remove attributes for start tags, except for <a> and <font>
  var attrsRemovedStartTags = VS.removeAttrs(tagsRemoved, options);

  //remove attributes for end tags
  var attrsRemovedEndTags = VS.removeAttrsEndTags(attrsRemovedStartTags, options);

  //filter attributes for <a> and <font>
  var attrsKept = VS.keepAttrs(attrsRemovedEndTags);

  //todo
  //check protocol for a tags
  return attrsKept;
};

//for start tags and <br>
VS.removeAttrs = function(input, options){
  //remove attributes for most whitelisted tags except <a> and <font>
  var noAttrElements = _.reject(options.elements, function(item){
    return (item === 'a' || item === 'font');
  });
  // http://forums.udacity.com/questions/5008300/hw3-3-basic-regex-for-matching-word-from-a-list-of-words
  // [] only matches single char
  // (?:) is a non-capturing group with disjunction
  // Example regex is
  // <\s*((?:b|u|ul|li|strong|em|h1|h2|h3|h4|h5|h6|blockquote|a|p|font|br))(?:\s+[^>]*>|>|\/>)
  //
  // \s* matches zero or more spaces
  // ((?:b|u|ul|li|strong|em|h1|h2|h3|h4|h5|h6|blockquote|a|p|font|br)) matches one of those tags
  // (?:\s+[^>]*>|>|\/>) matches <tag > or <tag> or <tag/>
  // note the last / is for <br/>
  var nRegex = new RegExp('<\\s*((?:' + noAttrElements.join('|') + '))(?:\\s+[^>]*>|>|\/>)', 'ig');
  return input.replace(nRegex, '<$1>');
};

VS.keepAttrs = function(input){
  //keep attribues for <a> and <font>
  //string.replace(regex, iterator)
  //the iterator is synchronous, similar to underscore iterators
  //http://stackoverflow.com/questions/19083357/are-all-javascript-callbacks-asynchronous-if-not-how-do-i-know-which-are
  // a: ['href', 'target', 'title'],
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/replace
  var keepA = input.replace(/<\s*a\s+([^>]*)>/ig, function(match, p1){
    var filtered = p1.match(/((?:href|target|title)\s*=\s*(?:(?:"[^"]*")|(?:'[^']*')))/ig) || [];
    return '<a ' + filtered.join(' ') + '>';
  });

  // font: ['face']
  var keepFont = keepA.replace(/<\s*font\s+([^>]*)>/ig, function(match, p1){
    var filtered = p1.match(/(face\s*=\s*(?:(?:"[^"]*")|(?:'[^']*')))/ig) || [];
    return '<font ' + filtered.join(' ') + '>';
  });

  return keepFont;
};

module.exports = VS;

},{"./sanitize":1}],3:[function(require,module,exports){
var _ = (window._),
  $ = (window.$),
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


},{"../scripts/versal.sanitize":2}],4:[function(require,module,exports){
/* global define, expect, it, describe, beforeEach, afterEach*/

var _ = (window._),
  $ = (window.$),
  VersalSanitize = require('../scripts/versal.sanitize');

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

},{"../scripts/versal.sanitize":2}]},{},[3,4])