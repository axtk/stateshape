import { Route } from "../../src/Route.ts";
import "./index.css";

let route = new Route();

route.on("navigationcomplete", () => {
  render();
});

// Enable SPA navigation with HTML links
route.observe(document);

function render() {
  document
    .querySelector('main[data-id="intro"]')!
    .toggleAttribute("hidden", route.pathname !== "/");

  document
    .querySelector('main[data-id="story"]')!
    .toggleAttribute("hidden", route.pathname !== "/story");

  document.body.removeAttribute("hidden");
}
