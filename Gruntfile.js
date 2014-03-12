module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    mocha: {
      src: ['test_runner.html'],
      options: {
        reporter: 'Spec'
      }
    },

    watch: {
      scripts: {
        //re-run testing when .js files change
        files: ['gadget.js', 'scripts/**/*.js', 'test/**/*.js'],
        tasks: ['mocha']
      }
    },

    requirejs: {
      dist: {
        options: {
          baseUrl: './',
          name: 'scripts/versal_sanitize',
          out: 'lib/vs.sanitize.js',
          cjsTranslate: true,
          optimize: 'none',
          paths: {
            'cdn.jquery': 'node_modules/versal-shared-libs/lib/core.min',
            'cdn.backbone': 'node_modules/versal-shared-libs/lib/core.min',
            'cdn.underscore': 'node_modules/versal-shared-libs/lib/core.min',

            'text': 'test/lib/text'
            //download text.js mannually from https://raw.github.com/requirejs/text/latest/text.js
            //and put it in test/lib/text.js
          }
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-mocha');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-requirejs');

  grunt.registerTask('test', ['mocha']);

  grunt.registerTask('default', ['requirejs' ,'mocha', 'watch']);
};
