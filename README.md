# react-app-page

Application controller component for [React][1]. Based on [react-app-controller][2] but doesn't use a new React component class for each page so sub-components shared between pages aren't automatically removed during reconcilliation.

It keeps track of `window.location` (via History API) and renders UI according
to its routes table.

[1]: https://facebook.github.io/react
[2]: https://github.com/andreypopp/react-app-controller

## Example usage:

```
var ReactApp = require('react-app-page');

var HomePage = ReactApp.createPage({
  componentDidMount: function () {
    this.setTitle('Home');
  },

  render: function () {
    return (
        <section>
            <h1>Project</h1>
            <a href="/about">About</a>
        </section>
    );
  }
});

var AboutPage = ReactApp.createPage({
  componentDidMount: function () {
    this.setTitle('About');
  },

  render: function () {
    return (
        <section>
            <h1>About</h1>
            <a href="/">Home</a>
        </section>
    );
  }
});

var controller = ReactApp.createController({
  routes: {
    '/': HomePage,
    '/about': AboutPage
  },

  onClick: function (e) {
    if (e.target.tagName === 'A' && e.target.attributes.href) {
      e.preventDefault();
      this.navigate(e.target.attributes.href.value);
    }
  },

  componentDidMount: function () {
    window.addEventListener('click', this.onClick);
  },

  componentWillUnmount: function () {
    window.removeEventListener('click', this.onClick);
  }
});

document.addEventListener('DOMContentLoaded', function () {
  controller.render(document.body, window.location.pathname);
});
```

## More info

TODO