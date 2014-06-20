var _ = require('underscore'),
  $ = require('jquery'),
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
