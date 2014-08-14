(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define([], factory);
    // SPECIAL case, versal-sdk has require in the env but stil need Browser globals
    // Browser globals (root is window)
    root.BaseCompMethods = factory();
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

  var _extend;
  if(typeof _ === 'function' && _.extend) {
    _extend = _.extend;
  } else {
    //straight from underscore
    //http://underscorejs.org/docs/underscore.html
    _extend = function(obj) {
      Array.prototype.forEach.call(Array.prototype.slice.call(arguments, 1), function(source) {
        if (source) {
          for (var prop in source) {
            obj[prop] = source[prop];
          }
        }
      });
      return obj;
    };
  }

  var BaseMethods = {
    propertiesObject : {
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
      _extend(eventObj, {
        type: '' + eventName,
        detail: data
      });
      //add options
      _extend(eventObj, options);
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
      if(!this.hasAttribute(name)) { return undefined; }
      return JSON.parse(this.getAttribute(name));
    }
  };

  // Just return a value to define the module export.
  // This example returns an object, but the module
  // can return a function as the exported value.
  return BaseMethods;
}));
