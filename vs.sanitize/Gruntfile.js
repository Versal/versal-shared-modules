module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    opts: {
      path: '.',
      name: 'vs.sanitize'
    },
    mocha: {
      all: {
        options: {
          log: true,
          urls: [ 'http://localhost:1337/test_runner.html' ],
          reporter: 'Spec',
          run: true
        }
      }
    },
    connect: {    /* for tesing in mocha */
      server: {
        options: {
          port: 1337,
          base: '<%= opts.path %>'
        }
      }
    },
    watch: {
      scripts: {
        files: ['scripts/**/*.js', 'test/**/*.js'],
        tasks: ['browserify', 'mocha']
      }
    },
    browserify: {
      dev: {
        options: {
          bundleOptions: {
            /* absolutely necessary */
            standalone: '<%= opts.name %>'
          }
        },
        files: {
          '<%= opts.path %>/dist/<%= opts.name %>.js': ['<%= opts.path %>/scripts/versal.sanitize.js']
        }
      },
      test: {
        files: {
          '<%= opts.path %>/dist/test.js': ['<%= opts.path %>/test/**/*.js']
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-mocha');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-browserify');

  grunt.registerTask('test', ['connect', 'mocha']);

  grunt.registerTask('default', ['browserify', 'test', 'watch']);
};
