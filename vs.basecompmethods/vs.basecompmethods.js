/* global _ */
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define([], factory);
    } else if (typeof exports === 'object') {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory();
    } else {
        // Browser globals (root is window)
        root.BaseCompMethods = factory();
  }
}(this, function () {

  var BaseMethods = {
    propertiesObject : {
      src: {
        get: function(){ return this.getAttribute('src') || 'about:blank'; }
      },

      editable: {
        get: function(){ return this.getAttribute('editable') === 'true'; }
      },

      env: {
        get: function(){ return this.readAttributeAsJson('data-environment'); }
      },

      config: {
        get: function(){ return this.readAttributeAsJson('data-config'); }
      },

      userstate: {
        get: function(){ return this.readAttributeAsJson('data-userstate'); }
      },

      debug: {
        get: function(){ return this.hasAttribute('debug'); }
      },

      apiVersion: {
        get: function(){
          if(!this._apiVersion) {
            this._apiVersion = new Semver(this.getAttribute('data-api-version') || '0.0.0');
          };
          return this._apiVersion;
        }
      }
    },

    trigger: function(eventName, data, options) {
      //set up default options to be overwritten
      var eventObj = {
        type: 'defaultEvent',
        bubbles: true,
        cancelable: false,
        detail: {}
      };
      //add eventName and data
      _.extend(eventObj, {
        type: '' + eventName,
        detail: data
      });
      //add options
      _.extend(eventObj, options);
      //fire away
      this.dispatchEvent( new CustomEvent(eventName, eventObj) );
    },

    on: function(){
      return this.addEventListener.apply(this, arguments);
    },

    off: function(){
      return this.removeEventListener.apply(this, arguments);
    },

    readAttributeAsJson : function(name) {
      if(!this.hasAttribute(name)) { return false; }
      return JSON.parse(this.getAttribute(name));
    }
  };

  // Just return a value to define the module export.
  // This example returns an object, but the module
  // can return a function as the exported value.
  return BaseMethods;
}));
