!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),(f.vs||(f.vs={})).sanitize=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
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

},{}],2:[function(_dereq_,module,exports){
var _ = (window._),
  $ = (window.$),
  Sanitize = _dereq_('./sanitize');

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

},{"./sanitize":1}]},{},[2])
(2)
});