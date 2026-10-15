/* global console, document, setTimeout */
// Renders Shiitake in every Sprite render style, light and dark, against a
// running root workbench (`pnpm workbench:serve`). Screenshots go to
// SPRITE_STYLES_SHOTS, or the ignored .botanical/sprite-styles/ directory.
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import process from "node:process";
import { fileURLToPath, URL } from "node:url";
import { chromium } from "playwright";

const base = process.env.SPRITE_WORKBENCH_URL ?? "http://127.0.0.1:61000";
const shots =
  process.env.SPRITE_STYLES_SHOTS ??
  fileURLToPath(new URL("../../../.botanical/sprite-styles/", import.meta.url));
await mkdir(shots, { recursive: true });
const styles = [
  "plain",
  "pencil",
  "manga",
  "riso",
  "halftone",
  "blueprint",
  "crt",
  "watercolor",
];
const story = (theme) =>
  `${base}/?story=sprite--render-styles--all-styles&mode=preview&theme=${theme}`;
const settle = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const browser = await chromium.launch();
try {
  for (const theme of ["light", "dark"]) {
    const page = await browser.newPage({
      viewport: { width: 1200, height: 900 },
    });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(story(theme));
    await page.waitForFunction(
      (count) =>
        document.querySelectorAll('[data-sprite-status="ready"]').length ===
        count,
      styles.length,
    );
    const filters = await page.evaluate(() =>
      [...document.querySelectorAll("[data-testid^=render-style-]")].map(
        (host) => ({
          style: host.getAttribute("data-testid"),
          stage: host.querySelector(":scope > div")?.style.filter ?? "",
          defined: [...host.querySelectorAll("filter")].map(
            (filter) => filter.id,
          ),
        }),
      ),
    );
    const ids = filters.flatMap((entry) => entry.defined);
    assert.equal(new Set(ids).size, ids.length, "filter ids are unique");
    for (const entry of filters) {
      if (entry.style === "render-style-plain") {
        assert.equal(entry.stage, "", "plain draws no filter");
        continue;
      }
      assert.equal(entry.defined.length, 1, `${entry.style} has one filter`);
      assert.ok(
        entry.stage.includes(entry.defined[0]),
        `${entry.style} stage uses its own filter`,
      );
    }
    await settle(400);
    const images = new Map();
    for (const style of styles) {
      const figure = page.locator(`[data-render-style="${style}"]`);
      images.set(
        style,
        await figure.screenshot({
          path: `${shots}/shiitake-${style}-${theme}.png`,
        }),
      );
    }
    for (const style of styles.slice(1))
      assert.notDeepEqual(
        images.get(style),
        images.get("plain"),
        `${style} changes the drawing`,
      );
    await page.screenshot({
      path: `${shots}/shiitake-all-${theme}.png`,
      fullPage: true,
    });
    assert.deepEqual(errors, [], `${theme} page has no errors`);
    await page.close();
  }

  // In motion an on-screen pencil boils; reduced motion holds a still frame.
  const seeds = async (reducedMotion) => {
    const page = await browser.newPage({
      viewport: { width: 1200, height: 900 },
      reducedMotion,
    });
    await page.goto(story("light"));
    const boil = page
      .locator('[data-testid="render-style-pencil"] [data-sprite-boil]')
      .first();
    await boil.waitFor({ state: "attached" });
    const seen = new Set();
    for (let step = 0; step < 6; step += 1) {
      seen.add(await boil.getAttribute("seed"));
      await settle(90);
    }
    await page.close();
    return seen.size;
  };
  assert.ok((await seeds("no-preference")) > 1, "pencil boils in motion");
  assert.equal(await seeds("reduce"), 1, "reduced motion keeps a still frame");
} finally {
  await browser.close();
}
console.log(`render styles verified; screenshots in ${shots}`);
