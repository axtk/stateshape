# sidestate

Vanilla TS/JS state management for data sharing across decoupled parts of the code and routing. Routing is essentially shared state management, too, with the shared data being the URL.

This package exposes the following classes:

```
EventEmitter ──► State ──► PersistentState
                    │
                    └────► URLState ──► Route
```

Roughly, their purpose boils down to the following:

- `EventEmitter` is for triggering actions without tightly coupling the interacting components
- `State` is `EventEmitter` that stores data and emits an event when the data gets updated, for dynamic data sharing without tight coupling
- `PersistentState` is `State` that syncs its data to the browser storage and restores it on page reload
- `URLState` is `State` that stores the URL + syncs with the browser's URL in a SPA fashion
- `Route` is `URLState` + native-like APIs for SPA navigation and an API for URL matching

## `State`

A thin data container for dynamic data sharing without tight coupling.

```js
import { State } from "sidestate";

const counterState = new State(42);

document.querySelector("button").addEventListener("click", () => {
  counterState.setValue((value) => value + 1);
});

counterState.on("set", ({ current }) => {
  document.querySelector("output").textContent = String(current);
});
```

In this example, a button changes a counter value and an `<output>` element shows the updating value. Both elements are only aware of the shared counter state, but not of each other.

A `"set"` event callback is invoked each time the state value changes and immediately when the callback is added. Subscribe to the `"update"` event to have the callback respond only to the subsequent state changes without the immediate invocation.

## `PersistentState`

A variety of `State` that syncs its data to the browser storage and restores it on page reload. Otherwise, almost identical to `State` in usage.

```js
import { PersistentState } from "sidestate";

const counterState = new PersistentState(42, { key: "counter" });

counterState.on("set", ({ current }) => {
  document.querySelector("output").textContent = String(current);
});
```

By default, `PersistentState` stores its data at the specified `key` in `localStorage` and transforms the data with `JSON.stringify()` and `JSON.parse()`. Switch to `sessionStorage` by setting `options.session` to `true` in `new PersistentState(value, options)`. Set custom `options.serialize()` and `options.deserialize()` to override the default data transforms.

Instances of `PersistentState` sync their values with the browser storage when created. Emit the `"sync"` event to signal the state to sync again.

## `Route`

Stores the URL, exposes a native-like API for SPA navigation and an API for URL matching.

```js
import { Route } from "sidestate";

const route = new Route();
```

Navigate to other URLs in a SPA fashion similarly to the native APIs:

```js
route.href = "/intro";
route.assign("/intro");
route.replace("/intro");
```

Or in a more fine-grained manner:

```js
route.navigate({ href: "/intro", history: "replace", scroll: "off" });
```

Check the current URL value like a regular `string` with `route.href`:

```js
route.href === "/intro";
route.href.startsWith("/sections/");
/^\/sections\/\d+\/?/.test(route.href);
```

Or, alternatively, with `route.at(url, x, y)` which is similar to the ternary conditional operator `atURL ? x : y`:

```js
document.querySelector("header").className = route.at("/", "full", "compact");
```

Use `route.at(url, x, y)` with dynamic values that require values from the URL pattern's capturing groups:

```js
document.querySelector("h1").textContent = route.at(
  /^\/sections\/(?<id>\d+)\/?/,
  ({ params }) => `Section ${params.id}`,
);
```

Enable SPA navigation with HTML links inside the specified container (or the entire `document`) without any changes to the HTML:

```js
route.observe(document);
```

Tweak the links' navigation behavior by adding a relevant combination of the optional `data-` attributes (corresponding to the `route.navigate()` options):

```html
<a href="/intro">Intro</a>
<a href="/intro" data-history="replace">Intro</a>
<a href="/intro" data-scroll="off">Intro</a>
<a href="/intro" data-spa="off">Intro</a>
```

Define what should be done when the URL changes:

```js
route.on("navigationcomplete", ({ href }) => {
  renderContent();
});
```

Define what should be done before the URL changes (in a way effectively similar to routing middleware):

```js
route.on("navigationstart", ({ href }) => {
  if (hasUnsavedInput)
    return false; // Preventing navigation

  if (href === "/") {
    route.href = "/intro"; // SPA redirection
    return false;
  }
});
```

## Integrations

[`react-sidestate`](https://www.npmjs.com/package/react-sidestate)
