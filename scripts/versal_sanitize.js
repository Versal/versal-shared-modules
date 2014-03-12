define(["cdn.jquery", "cdn.underscore", "scripts/lib/sanitize"],
function ($, _ , Sanitize) {
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

  return VS;
});
