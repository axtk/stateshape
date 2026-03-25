import { createURLBuilder } from "url-shape";
import { z } from "zod";
import { Route } from "../../src/Route.ts";
import "./index.css";

// Get a typed URL builder `url()` based on a URL schema.
// A schema can cover the entire app or its portion, allowing for incremental
// or partial adoption of type-safe routing.
let url = createURLBuilder({
  "/sections/:id": z.object({
    // URL path placeholder parameters
    params: z.object({
      id: z.coerce.number(),
    }),
    // An optional URL `query` schema can be defined here, too
  }),
  "/": z.object({}), // No parameters, empty schema
});

let route = new Route();

route.on("navigationcomplete", () => {
  renderHeader();
  renderMainContent();
});

// Enable SPA navigation with HTML links
route.observe(document);

function renderHeader() {
  document.querySelector("header")!.className =
    route.href === url("/").href ? "full" : "compact";
}

function renderMainContent() {
  // `ok` is `true` if the current URL matches the given URL pattern.
  // `params` contains the capturing groups from the RegExp URL pattern.
  // With the type-safe URL pattern, `params` are typed according to
  // the URL schema created above.
  let { ok: isSection, params } = route.match(url("/sections/:id"));

  if (isSection)
    document.querySelector('[data-id="section"] h2 span')!.textContent = String(
      params.id,
    );

  document
    .querySelector('main[data-id="intro"]')!
    .toggleAttribute("hidden", isSection);

  document
    .querySelector('main[data-id="section"]')!
    .toggleAttribute("hidden", !isSection);

  document.body.removeAttribute("hidden");
}
