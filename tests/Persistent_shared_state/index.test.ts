import { expect, type Locator, type Page, test } from "@playwright/test";
import { type Server, serve } from "auxsrv";

class Playground {
  readonly page: Page;
  readonly plus: Locator;
  readonly reset: Locator;
  readonly output: Locator;
  constructor(page: Page) {
    this.page = page;
    this.plus = page.locator("button.plus");
    this.reset = page.locator("button.reset");
    this.output = page.locator("output");
  }
}

test.describe("counter", () => {
  let server: Server;

  test.beforeAll(async () => {
    server = await serve({ path: import.meta.url });
  });

  test.afterAll(() => {
    server.close();
  });

  test("update and reset", async ({ page }) => {
    let p = new Playground(page);

    await page.goto("/");
    await page.evaluate(() => {
      window.localStorage.removeItem("sidestate-dev-counter");
    });
    await page.reload();

    await expect(p.output).toHaveText("42");
    await p.plus.click();
    await p.plus.click();
    await p.plus.click();
    await expect(p.output).toHaveText("45");
    await p.reset.click();
    await expect(p.output).toHaveText("0");
    await p.plus.click();
    await expect(p.output).toHaveText("1");
  });

  test("update and reload", async ({ page }) => {
    let p = new Playground(page);

    await page.goto("/");
    await page.evaluate(() => {
      window.localStorage.removeItem("sidestate-dev-counter");
    });
    await page.reload();

    await expect(p.output).toHaveText("42");
    await p.plus.click();
    await p.plus.click();
    await p.plus.click();
    await expect(p.output).toHaveText("45");

    await page.reload();
    await expect(p.output).toHaveText("45");
    await p.plus.click();
    await expect(p.output).toHaveText("46");
    await p.reset.click();
    await expect(p.output).toHaveText("0");

    await page.reload();
    await expect(p.output).toHaveText("0");
    await p.plus.click();
    await expect(p.output).toHaveText("1");
  });
});
