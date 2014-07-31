Shared Modules, modules reusable across different gadgets
==========================

### A place to share UMD JavaScript modules
- each module should be created as a sub directory
- each module should then register itself for export inside the index.js in the root of the repo

### To use with npm
Add this to your package.json
```
"devDependencies": {
  "shared-modules": "git+ssh://git@github.com:Versal/shared-modules"
}
```
Then
```
npm install
```
Then in your code, if you are using CommonJS
```
var YourModule = require('shared-modules').yourModule;
```

### To use with bower
Add this to your bower.json
```
"dependencies": {
  "versal-shared-modules": "git@github.com:Versal/shared-modules.git"
}
```
Then
```
bower install
```
Then in your HTML, if you are into Browser globals
```
<script type="text/javascript" src="../versal-shared-modules/your_module/your_module.js"></script>
```
And now the module should be available under window.yourModule


### To create
1. Export the module build as an UMD
2. Add it to module.exports in index.js

### Notes:
- Prefer CommonJS with browserify. UMD can be built by using the [**standalone**](https://github.com/substack/node-browserify#usage) option of browserify. With browserify-grunt, it looks like this
```
grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    opts: {
      path: '.',
      name: 'vs.sanitize'
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
      }
    }
})
```
