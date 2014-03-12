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
          name: 'plugins/vs.analytics',
          out: 'lib/vs.analytics.js',
          cjsTranslate: true,
          optimize: 'none'
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