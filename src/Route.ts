import { QuasiURL } from "quasiurl";
import type { StateOptions } from "./State.ts";
import type { LinkElement } from "./types/LinkElement.ts";
import type { LocationPattern } from "./types/LocationPattern.ts";
import type { LocationValue } from "./types/LocationValue.ts";
import type { MatchHandler } from "./types/MatchHandler.ts";
import type { NavigationOptions } from "./types/NavigationOptions.ts";
import type { URLData } from "./types/URLData.ts";
import { URLState } from "./URLState.ts";
import { compileURL } from "./utils/compileURL.ts";
import { getNavigationOptions } from "./utils/getNavigationOptions.ts";
import { isRouteEvent } from "./utils/isRouteEvent.ts";
import { matchURL } from "./utils/matchURL.ts";

export type ContainerElement = Document | Element | null | undefined;
export type ElementCollection = (string | Node)[] | HTMLCollection | NodeList;

export type ObservedElement =
  | string
  | Node
  | (string | Node)[]
  | HTMLCollection
  | NodeList;

let isElementCollection = (x: unknown): x is ElementCollection =>
  Array.isArray(x) || x instanceof NodeList || x instanceof HTMLCollection;

let isLinkElement = (x: unknown): x is LinkElement =>
  x instanceof HTMLAnchorElement || x instanceof HTMLAreaElement;

export class Route extends URLState {
  _clicks = new Set<(event: MouseEvent) => void>();
  constructor(href: LocationValue | null = null, options?: StateOptions) {
    super(String(href ?? ""), options);
  }
  _init() {
    super._init();

    if (typeof window === "undefined") return;

    let handleClick = (event: MouseEvent) => {
      for (let callback of this._clicks) callback(event);
    };

    this.on("start", () => {
      document.addEventListener("click", handleClick);
    });

    this.on("stop", () => {
      document.removeEventListener("click", handleClick);
    });
  }
  /**
   * Enables SPA navigation with HTML links inside the specified container.
   *
   * @example
   * ```js
   * let route = new Route();
   * route.observe(document);
   * ```
   */
  observe(
    container: ContainerElement | (() => ContainerElement),
    elements: ObservedElement = "a, area",
  ) {
    let handleClick = (event: MouseEvent) => {
      if (!this._active || event.defaultPrevented || !isRouteEvent(event))
        return;

      let resolvedContainer =
        typeof container === "function" ? container() : container;

      if (!resolvedContainer) return;

      let element: HTMLAnchorElement | HTMLAreaElement | null = null;
      let targetElements = isElementCollection(elements)
        ? Array.from(elements)
        : [elements];

      for (let targetElement of targetElements) {
        let target: Node | null = null;

        if (typeof targetElement === "string")
          target =
            event.target instanceof HTMLElement
              ? event.target.closest(targetElement)
              : null;
        else target = targetElement;

        if (isLinkElement(target) && resolvedContainer.contains(target)) {
          element = target;
          break;
        }
      }

      if (element) {
        event.preventDefault();
        this.navigate(getNavigationOptions(element));
      }
    };

    this._clicks.add(handleClick);

    return () => {
      this._clicks.delete(handleClick);
    };
  }
  /**
   * Navigates to the URL specified with `options.href`.
   *
   * @example
   * ```js
   * let route = new Route();
   * route.navigate({ href: "/intro", history: "replace", scroll: "off" });
   * ```
   */
  navigate(options?: NavigationOptions<LocationValue>): void {
    if (!options?.href) return;

    let { href, referrer, ...params } = options;

    // Stringify `LocationValue` URLs in `options`
    let transformedOptions = {
      href: String(href),
      referrer: referrer && String(referrer),
      ...params,
    };

    this.setValue(transformedOptions.href, transformedOptions);
  }
  assign(url: LocationValue) {
    this.navigate({ href: url });
  }
  replace(url: LocationValue) {
    this.navigate({ href: url, history: "replace" });
  }
  reload() {
    this.assign(this.getValue());
  }
  go(delta: number) {
    if (typeof window !== "undefined" && window.history)
      window.history.go(delta);
  }
  back() {
    this.go(-1);
  }
  forward() {
    this.go(1);
  }
  get href(): string {
    return this.getValue();
  }
  set href(value: LocationValue) {
    this.assign(value);
  }
  get pathname(): string {
    return new QuasiURL(this.href).pathname;
  }
  set pathname(value: LocationValue) {
    let url = new QuasiURL(this.href);
    url.pathname = String(value);
    this.assign(url.href);
  }
  get search(): string {
    return new QuasiURL(this.href).search;
  }
  set search(value: string | URLSearchParams) {
    let url = new QuasiURL(this.href);
    url.search = value;
    this.assign(url.href);
  }
  get hash() {
    return new QuasiURL(this.href).hash;
  }
  set hash(value: string) {
    let url = new QuasiURL(this.href);
    url.hash = value;
    this.assign(url.href);
  }
  toString() {
    return this.href;
  }
  /**
   * Matches the current location against `urlPattern`.
   */
  match<P extends LocationPattern>(urlPattern: P) {
    return matchURL<P>(urlPattern, this.href);
  }
  /**
   * Compiles `urlPattern` to a URL string by filling out the parameters
   * based on `data`.
   */
  compile<T extends LocationValue>(urlPattern: T, data?: URLData<T>) {
    return compileURL<T>(urlPattern, data);
  }
  /**
   * Checks whether `urlPattern` matches the current URL and returns either
   * based on `x` if there is a match, or based on `y` otherwise. (It
   * loosely resembles the ternary conditional operator
   * `matchesPattern ? x : y`.)
   *
   * If the current location matches `urlPattern`, `at(urlPattern, x, y)`
   * returns:
   * - `x`, if `x` is not a function;
   * - `x({ params })`, if `x` is a function, with `params` extracted from
   * the current URL.
   *
   * If the current location doesn't match `urlPattern`, `at(urlPattern, x, y)`
   * returns:
   * - `y`, if `y` is not a function;
   * - `y({ params })`, if `y` is a function, with `params` extracted from
   * the current URL.
   */
  at<P extends LocationPattern, X>(
    urlPattern: P,
    matchOutput: X | MatchHandler<P, X>,
  ): X | undefined;

  at<P extends LocationPattern, X, Y>(
    urlPattern: P,
    matchOutput: X | MatchHandler<P, X>,
    mismatchOutput: Y | MatchHandler<P, Y>,
  ): X | Y;

  at<P extends LocationPattern, X, Y>(
    urlPattern: P,
    matchOutput: X | MatchHandler<P, X>,
    mismatchOutput?: Y | MatchHandler<P, Y>,
  ): X | Y | undefined {
    let result = this.match<P>(urlPattern);

    if (!result.ok)
      return typeof mismatchOutput === "function"
        ? (mismatchOutput as MatchHandler<P, Y>)(result)
        : mismatchOutput;

    return typeof matchOutput === "function"
      ? (matchOutput as MatchHandler<P, X>)(result)
      : matchOutput;
  }
}
