import { Route } from "../../src/Route.ts";
import "./index.css";

let route = new Route();

route.on("navigationstart", ({ href }) => {
  if (href === "/") {
    route.assign("/sections/1"); // SPA redirection
    return false; // Quit the current navigation
  }
});

route.on("navigationcomplete", () => {
  renderHeader();
  renderMainContent();
});

// Enable SPA navigation with HTML links
route.observe(document);

function renderHeader() {
  document.querySelector("header")!.className =
    route.href === "/" ? "full" : "compact";
}

function renderMainContent() {
  let matches = route.href.match(/^\/sections\/(?<id>\d+)\/?/);
  let isSection = matches !== null;

  document.querySelector('[data-id="section"] h2 span')!.textContent =
    matches?.[1] ?? "";

  document
    .querySelector('main[data-id="intro"]')!
    .toggleAttribute("hidden", isSection);

  document
    .querySelector('main[data-id="section"]')!
    .toggleAttribute("hidden", !isSection);

  document.body.removeAttribute("hidden");
}
