"use strict";

var invariant               = require('react/lib/invariant');
var NotFoundError           = require('react-app-controller/not-found-error');
var utils                   = require('react-app-controller/utils');
var factory                 = require('react-app-controller/factory');
var BaseInterface           = require('react-app-controller/interface');
var BaseRenderingInterface  = require('react-app-controller/rendering-interface');

/**
 * Creates a function that invokes two functions and ignores their return vales.
 *
 * @param {function} one Function to invoke first.
 * @param {function} two Function to invoke second.
 * @return {function} Function that invokes the two argument functions.
 * @private
 */
function createChainedFunction (one, two) {
  return function chainedFunction () {
    one.apply(this, arguments);
    two.apply(this, arguments);
  };
}

function noop () {}

var ControllerInterface = utils.extend(BaseInterface, {

  /**
   * Create a page for a specified request
   *
   * @param {Request} req
   * @private
   */
  createPageForRequest: function (req) {
    var match = this.router.match(req.path);

    if (!match) {
      throw new NotFoundError(req.path);
    }

    var props = utils.extend({request: req}, match.params);
    return new match.handler(this, props);
  },

  defaultRender: function () {
    return this.state.page.render();
  },

  componentWillUpdate: function (nextProps, nextState) {
    if (this.state.page !== nextState.page) {
      if (this.state.page.state) {
        if (typeof this.state.page.componentWillUnmount === 'function') {
          this.state.page.componentWillUnmount();
        }
      }

      if (typeof nextState.page.componentWillMount === 'function') {
        nextState.page.componentWillMount();
      }
    }
  },

  componentDidUpdate: function (prevProps, prevState) {
    if (prevState.page !== this.state.page) {
      if (prevState.page.state) {
        if (typeof prevState.page.componentDidUnmount === 'function') {
          prevState.page.componentDidUnmount();
        }
      }

      if (typeof this.state.page.componentDidMount === 'function') {
        this.state.page.componentDidMount(this.getDOMNode());
      }
    }
  }
});

function Page (controller, props) {
  this.controller = controller;
  this.state = controller.state;
  this.props = utils.assign(Object.create(controller.props), props);
}

Page.prototype = {
  getDOMNode: function () {
    return this.controller.getDOMNode();
  },

  isMounted: function () {
    return (this.controller.isMounted() && this.controller.state.page === this);
  },

  forceUpdate: function () {
    this.controller.forceUpdate();
  },

  setTitle: function (title) {
    document.title = title;
  }
};

var MANY = [
  'componentWillMount',
  'componentDidMount',
  'componentWillUnmount',
  'componentDidUnmount'
];

function mixSpecIntoComponent (Constructor, spec) {
  var proto = Constructor.prototype;
  for (var name in spec) {
    var property = spec[name];
    if (!spec.hasOwnProperty(name) || !property) {
      continue;
    }

    if (MANY.indexOf(name) > -1) {
      if (typeof proto[name] !== 'function') {
        proto[name] = noop;
      }
      proto[name] = createChainedFunction(proto[name], property);
    } else {
      proto[name] = property;
    }
  }
}

function createPage (spec) {
  invariant(
    typeof spec.render === 'function',
    'createPage(spec): `render` function should be provided'
  );

  function PageConstructor (controller, props) {
    Page.call(this, controller, props);
  }

  PageConstructor.prototype = utils.assign(Object.create(Page.prototype), spec);

  if (spec.hasOwnProperty('mixins')) {
    for (var i = 0; i < spec.mixins.length; i++) {
      mixSpecIntoComponent(PageConstructor, spec.mixins[i]);
    }
    delete PageConstructor.prototype.mixins;
  }

  return PageConstructor;
}

function createController (spec) {
  return factory(ControllerInterface, BaseRenderingInterface, spec);
}


module.exports = createController;
module.exports.createController = createController;
module.exports.createPage = createPage;
