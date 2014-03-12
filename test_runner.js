define([], function() {

/*
There may be times when you do want to reference a script directly and not conform to the "baseUrl + paths" rules for finding it. If a module ID has one of the following characterstics, the ID will not be passed through the "baseUrl + paths" configuration, and just be treated like a regular URL that is relative to the document:
Ends in ".js".
Starts with a "/".
Contains an URL protocol, like "http:" or "https:".
*/

  /* app specs here */
  var specs = [
  ];

  //temp solution for now
  var sharedLibsUrl = 'node_modules/versal-shared-libs/lib/core.min';

  require.config({
    paths: {
      'cdn.jquery': sharedLibsUrl,
      'cdn.backbone': sharedLibsUrl,
      'cdn.underscore': sharedLibsUrl,

      'text': 'test/lib/text'
      //download text.js mannually from https://raw.github.com/requirejs/text/latest/text.js
      //and put it in test/lib/text.js
    },

    callback: function() {
      require(specs, function() {
        if (window.mochaPhantomJS) {
          mochaPhantomJS.run();
        } else {
          mocha.run();
        }
      });
    }
  });

});
