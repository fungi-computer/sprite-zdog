// @vitest-environment jsdom
import { createSprite } from "@fungi.computer/sprite";
import renderZdog from "@fungi.computer/sprite-zdog";
import { check } from "@fungi.computer/sprite-zdog/author";
import { toCharacter } from "@fungi.computer/sprite-zdog/portable";
import { afterEach, describe, expect, it, vi } from "vitest";
import moth from "./moth.js";

afterEach(() => vi.restoreAllMocks());

describe("outside-authored Zdog character", () => {
  it("compiles a custom character into portable scene data", () => {
    const receipt = check(moth);
    expect(receipt).toMatchObject({ valid: true, name: "moth" });
    expect(receipt.nodeCount).toBeGreaterThan(0);
    expect(receipt.expressions).toEqual(["normal", "alert"]);
    expect(receipt.activities).toContain("flutter");

    const document = toCharacter(moth);
    expect(document).toMatchObject({
      version: 1,
      name: "moth",
      renderer: "zdog",
    });
    expect(JSON.parse(JSON.stringify(document))).toEqual(document);
  });

  it("plays and updates the custom character through the shared player", async () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
    const target = window.document.createElement("div");
    window.document.body.append(target);
    const document = toCharacter(moth);
    const player = createSprite({
      characters: {
        moth: () => Promise.resolve({ document, render: renderZdog }),
      },
    }).mount(target);

    player.set({ src: { local: "moth" }, activity: "idle" });
    await vi.waitFor(() => {
      expect(player.state.status).toBe("ready");
    });
    const canvas = target.querySelector("canvas");
    expect(canvas).toBeInstanceOf(HTMLCanvasElement);

    player.set({
      src: { local: "moth" },
      activity: "flutter",
      expression: "alert",
      appearance: { body: "#ffffff" },
    });
    await vi.waitFor(() => {
      expect(player.state).toMatchObject({
        status: "ready",
        presentation: {
          activity: "flutter",
          expression: "alert",
          appearance: { body: "#ffffff" },
          fallback: false,
        },
      });
    });
    expect(target.querySelector("canvas")).toBe(canvas);

    await player.dispose();
    expect(target.children).toHaveLength(0);
    expect(player.state.status).toBe("destroyed");
    target.remove();
  });
});
