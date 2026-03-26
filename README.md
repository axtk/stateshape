# stateshape

Vanilla TS/JS state management for sharing data across decoupled parts of the code and routing. Routing is essentially shared state management, too, with the shared data being the URL.

This package exposes the following classes:

```
EventEmitter ──► State ──► PersistentState
                    │
                    └────► URLState ──► Route
```

Roughly, their purpose boils down to the following:

- `EventEmitter` is for triggering actions without tightly coupling the interacting components
- `State` is `EventEmitter` that stores data and emits an event when the data gets updated, it's for dynamic data sharing without tight coupling
- `PersistentState` is `State` that syncs its data to the browser storage and restores it on page reload
- `URLState` is `State` that stores the URL + syncs with the browser's URL in a SPA fashion
- `Route` is `URLState` + native-like APIs for SPA navigation and an API for URL matching

Contents: [State](#state) · [PersistentState](#persistentstate) · [Route](#route) · [Annotated examples](#annotated-examples) · [Integrations](#integrations)

## `State`

A thin data container for dynamic data sharing without tight coupling.

```js
import { State } from "stateshape";

const counterState = new State(42);

document.querySelector("button").addEventListener("click", () => {
  counterState.setValue((value) => value + 1);
});

counterState.on("set", ({ current }) => {
  document.querySelector("output").textContent = String(current);
});
```

In this example, a button changes a counter value and an `<output>` element shows the updating value. Both elements are only aware of the shared counter state, but not of each other.

A `"set"` event callback is called each time the state value changes and immediately when the callback is added. Subscribe to the `"update"` event to have the callback respond only to the subsequent state changes without the immediate invocation.

## `PersistentState`

A variety of `State` that syncs its data to the browser storage and restores it on page reload. Otherwise, almost identical to `State` in usage.

```diff
- import { State } from "stateshape";
+ import { PersistentState } from "stateshape";

- const counterState = new State(42);
+ const counterState = new PersistentState(42, { key: "counter" });

  document.querySelector("button").addEventListener("click", () => {
    counterState.setValue((value) => value + 1);
  });

  counterState.on("set", ({ current }) => {
    document.querySelector("output").textContent = String(current);
  });
```

By default, `PersistentState` stores its data at the specified `key` in `localStorage` and transforms the data with `JSON.stringify()` and `JSON.parse()`. Switch to `sessionStorage` by setting `options.session` to `true` in `new PersistentState(value, options)`. Set custom `serialize()` and `deserialize()` in `options` to override the default data transforms used with the browser storage. Alternatively, use custom `{ read(), write()? }` as `options` to set up custom interaction with an external storage.

Instances of `PersistentState` automatically sync their values with the browser storage when created and updated. At other times, call `.emit("sync")` on a `PersistentState` instance to sync its value from the browser storage when needed.

## `Route`

Stores the URL, exposes a native-like API for SPA navigation and an API for URL matching.

```js
import { Route } from "stateshape";

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

Links covered by `route.observe(container, selector?)` also automatically receive the `data-active="true"` attribute whenever their `href` attribute matches the current URL, which can be used for additional styling. If links are added to the DOM asynchronously, call `route.emit("ready")` when the rendering is complete to mark active links.

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
    return false; // Quit the navigation, prevent the current URL change

  if (href === "/") {
    route.href = "/intro"; // SPA redirection
    return false;
  }
});
```

## Annotated examples

- [Shared state](https://codesandbox.io/p/sandbox/lqt3z2?file=%252Fsrc%252Findex.ts), counter app, State
- [Shared form input state](https://codesandbox.io/p/sandbox/4q7f99?file=%252Fsrc%252Findex.ts), simple form, State
- [Persistent shared state](https://codesandbox.io/p/sandbox/c9gt3r?file=%252Fsrc%252Findex.ts), counter app, PersistentState
- [URL-based rendering](https://codesandbox.io/p/sandbox/kt6m5l?file=%252Fsrc%252Findex.ts), Route
- [Type-safe URL-based rendering](https://codesandbox.io/p/sandbox/qg7qg3?file=%2Fsrc%2Findex.ts), Route, url-shape, zod
- [SPA redirection](https://codesandbox.io/p/sandbox/rpl3gh?file=%252Fsrc%252Findex.ts), Route

Find also the code of these examples in the repo's [`tests`](https://github.com/axtk/stateshape/tree/main/tests) directory.

## Integrations

[`react-stateshape`](https://www.npmjs.com/package/react-stateshape)
