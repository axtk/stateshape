import { url } from "url-shape";
import { Route } from "../../src/Route.ts";
import "./index.css";

let route = new Route();

route.on("navigationcomplete", () => {
  renderHeader();
  renderMainContent();
});

// Enable SPA navigation with HTML links
route.observe(document);

function renderHeader() {
  // `at(url, x, y)` acts like `atURL ? x : y`
  document.querySelector("header")!.className = route.at(
    url("/"),
    "full",
    "compact",
  );
}

function renderMainContent() {
  // `ok` is `true` if the current URL matches the given URL pattern.
  // `params` contains the path placeholder values.
  let { ok: isSection, params } = route.match(url("/sections/:id"));

  if (isSection)
    document.querySelector('[data-id="section"] h2 span')!.textContent =
      params.id ?? "";

  document
    .querySelector('main[data-id="intro"]')!
    .toggleAttribute("hidden", isSection);

  document
    .querySelector('main[data-id="section"]')!
    .toggleAttribute("hidden", !isSection);

  document.body.removeAttribute("hidden");
}
