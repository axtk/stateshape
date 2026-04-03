import { expect, type Page, test } from "@playwright/test";
import { type Server, serve } from "auxsrv";

class Playground {
  readonly page: Page;
  constructor(page: Page) {
    this.page = page;
  }
  async clickLink(name: string) {
    await this.page.getByRole("link", { name }).click();
  }
  async hasActiveLink(name: string) {
    await expect(this.page.getByRole("link", { name })).toHaveAttribute(
      "data-active",
      "true",
    );
  }
  async hasInactiveLink(name: string) {
    await expect(this.page.getByRole("link", { name })).not.toHaveAttribute(
      "data-active",
    );
  }
  async hasPath(value: string) {
    await expect(this.page).toHaveURL(
      ({ pathname, search }) => pathname + search === value,
    );
  }
  async hasMainTitle() {
    await expect(this.page.locator("h1")).toBeVisible();
  }
  async hasSectionTitle(value: string) {
    await expect(this.page.locator("h2:visible")).toHaveText(value);
  }
  async hasFullHeader() {
    await expect(this.page.locator("header")).toHaveClass("full");
  }
  async hasCompactHeader() {
    await expect(this.page.locator("header")).toHaveClass("compact");
  }
  async setSessionId(value: string) {
    await this.page.evaluate((value) => {
      window.document.body.dataset.sessionId = value;
    }, value);
  }
  /** Helps make sure there were no full page reloads. */
  async hasSessionId(value: string) {
    expect(
      await this.page.evaluate(() => window.document.body.dataset.sessionId),
    ).toBe(value);
  }
}

test.describe("routing", () => {
  let server: Server;

  test.beforeAll(async () => {
    server = await serve({ path: import.meta.url });
  });

  test.afterAll(() => {
    server.close();
  });

  test("spa links", async ({ page }) => {
    let p = new Playground(page);
    let sessionId = "spa";

    await page.goto("/");
    await p.setSessionId(sessionId);
    await p.hasMainTitle();
    await p.hasFullHeader();

    await p.hasActiveLink("Intro");
    await p.hasInactiveLink("Section 1");
    await p.hasInactiveLink("Section 2");

    await p.clickLink("Section 1");
    await p.hasPath("/sections/1");
    await p.hasSessionId(sessionId);
    await p.hasSectionTitle("Section 1");
    await p.hasCompactHeader();

    await p.hasInactiveLink("Intro");
    await p.hasActiveLink("Section 1");
    await p.hasInactiveLink("Section 2");

    await p.clickLink("Section 2");
    await p.hasPath("/sections/2");
    await p.hasSessionId(sessionId);
    await p.hasSectionTitle("Section 2");
    await p.hasCompactHeader();

    await p.hasInactiveLink("Intro");
    await p.hasInactiveLink("Section 1");
    await p.hasActiveLink("Section 2");

    await p.clickLink("Intro");
    await p.hasPath("/");
    await p.hasSessionId(sessionId);
    await p.hasSectionTitle("Intro");
    await p.hasFullHeader();

    await p.hasActiveLink("Intro");
    await p.hasInactiveLink("Section 1");
    await p.hasInactiveLink("Section 2");
  });

  test("non-root url", async ({ page }) => {
    let p = new Playground(page);

    await page.goto("/sections/10");
    await p.hasSectionTitle("Section 10");
    await p.hasCompactHeader();

    await p.clickLink("Intro");
    await p.hasPath("/");
    await p.hasSectionTitle("Intro");
    await p.hasFullHeader();

    await p.clickLink("Section 1");
    await p.hasPath("/sections/1");
    await p.hasSectionTitle("Section 1");
    await p.hasCompactHeader();
  });
});
