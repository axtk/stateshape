import { expect, type Locator, type Page, test } from "@playwright/test";
import { type Server, serve } from "auxsrv";

class Playground {
  readonly page: Page;
  readonly input: Locator;
  readonly output: Locator;
  constructor(page: Page) {
    this.page = page;
    this.input = page.locator("input");
    this.output = page.locator("output");
  }
}

test.describe("form state", () => {
  let server: Server;

  test.beforeAll(async () => {
    server = await serve({ path: import.meta.url });
  });

  test.afterAll(() => {
    server.close();
  });

  test("type", async ({ page }) => {
    let p = new Playground(page);

    await page.goto("/");
    await expect(p.output).toHaveText("{username}");
    await p.input.fill("Jane");
    await expect(p.output).toHaveText("Jane");
    await p.input.clear();
    await expect(p.output).toHaveText("{username}");
    await p.input.fill("Jack");
    await expect(p.output).toHaveText("Jack");
  });
});
