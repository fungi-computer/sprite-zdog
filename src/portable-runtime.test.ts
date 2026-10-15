// @vitest-environment jsdom
import { createSprite, characterSchema } from "@fungi.computer/sprite";
import { afterEach, describe, expect, it, vi } from "vitest";

import renderZdog from "./index.js";
import { zdogDocumentSchema } from "./document.js";
import { toCharacter } from "./portable.js";
import mushroom from "./builtins/mushroom.js";
import base from "./builtins/base.js";
import cat from "./builtins/cat.js";
import burger from "./builtins/burger.js";

const assets = {
  baseURL: "https://art.example/",
  allowedOrigins: ["https://art.example"],
  maxBytes: 1024,
  maxTotalBytes: 4096,
  maxRequests: 8,
};

const originalDpr = window.devicePixelRatio;
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  Object.defineProperty(window, "devicePixelRatio", {
    configurable: true,
    value: originalDpr,
  });
});

describe("portable Zdog runtime", () => {
  it.each([base, mushroom, cat, burger])(
    "accepts built-in %s as portable scene data",
    async (definition) => {
      vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
      const portable = characterSchema.parse(
        JSON.parse(JSON.stringify(toCharacter(definition))),
      );
      const target = window.document.createElement("div");
      const player = createSprite({
        assets,
        renderers: {},
        characters: {
          builtIn: () =>
            Promise.resolve({ document: portable, render: renderZdog }),
        },
      }).mount(target);
      player.set({ src: { local: "builtIn" }, activity: "idle" });
      await vi.waitFor(() => {
        expect(player.state.status).toBe("ready");
      });
      expect(target.querySelector("canvas")).toBeInstanceOf(HTMLCanvasElement);
      await player.dispose();
    },
  );

  it("renders a JSON-round-tripped built-in without its author object", async () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
    const portable = characterSchema.parse(
      JSON.parse(JSON.stringify(toCharacter(mushroom))),
    );
    const target = window.document.createElement("div");
    target.style.width = "96px";
    target.style.height = "96px";
    window.document.body.append(target);
    const player = createSprite({
      assets,
      renderers: {},
      characters: {
        mushroom: () =>
          Promise.resolve({ document: portable, render: renderZdog }),
      },
    }).mount(target);
    player.set({
      src: { local: "mushroom" },
      activity: "speaking",
      expression: "happy",
    });
    await vi.waitFor(() => {
      expect(player.state.status).toBe("ready");
    });
    expect(target.querySelector("canvas")).toBeInstanceOf(HTMLCanvasElement);
    expect(player.state).toMatchObject({
      status: "ready",
      presentation: {
        activity: "speaking",
        expression: "happy",
        fallback: false,
      },
    });
    await player.dispose();
    expect(target.children).toHaveLength(0);
    target.remove();
  });

  it("rejects an unknown variant reference before native allocation", async () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
    const portable = toCharacter(mushroom);
    const data = zdogDocumentSchema.parse(portable.data);
    const invalid = characterSchema.parse({
      ...portable,
      data: {
        ...data,
        expressions: { happy: { variants: { eyes: "missing" } } },
      },
    });
    const target = window.document.createElement("div");
    const player = createSprite({
      assets,
      renderers: {},
      characters: {
        invalid: () =>
          Promise.resolve({ document: invalid, render: renderZdog }),
      },
    }).mount(target);
    player.set({ src: { local: "invalid" } });
    await vi.waitFor(() => {
      expect(player.state.status).toBe("error");
    });
    expect(target.querySelector("canvas")).toBeNull();
    await player.dispose();
  });

  it("resizes against the attached host and bounds DPR-backed canvas pixels", async () => {
    Object.defineProperty(window, "devicePixelRatio", {
      configurable: true,
      value: 2,
    });
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
    let onResize: ResizeObserverCallback | undefined;
    class TestResizeObserver {
      constructor(callback: ResizeObserverCallback) {
        onResize = callback;
      }
      observe() {
        /* The test triggers resize explicitly. */
      }
      disconnect() {
        /* Scope cleanup owns it. */
      }
    }
    vi.stubGlobal("ResizeObserver", TestResizeObserver);
    const target = window.document.createElement("div");
    target.style.width = "192px";
    target.style.height = "192px";
    window.document.body.append(target);
    const player = createSprite({
      assets,
      maxPixels: 4096,
      renderers: {},
      characters: {
        base: () =>
          Promise.resolve({ document: toCharacter(base), render: renderZdog }),
      },
    }).mount(target);
    player.set({ src: { local: "base" } });
    await vi.waitFor(() => {
      expect(player.state.status).toBe("ready");
    });
    const canvas = target.querySelector("canvas");
    expect(canvas).not.toBeNull();
    if (!canvas) throw new Error("Zdog canvas was not mounted");
    expect(canvas.width * canvas.height).toBeLessThanOrEqual(4096);
    target.style.width = "48px";
    target.style.height = "36px";
    // SAFETY: The callback does not inspect its observer argument.
    onResize?.([], {} as ResizeObserver);
    expect(canvas.width * canvas.height).toBeLessThanOrEqual(4096);
    expect(canvas.width).toBeGreaterThan(canvas.height);
    await player.dispose();
    target.remove();
  });

  it("keeps a still first frame under reduced motion after layout resizes", async () => {
    let paints = 0;
    const noop = () => undefined;
    const paint = () => {
      paints += 1;
    };
    const context: Partial<CanvasRenderingContext2D> = {
      arc: noop,
      beginPath: noop,
      bezierCurveTo: noop,
      clearRect: noop,
      closePath: noop,
      fill: paint,
      lineTo: noop,
      moveTo: noop,
      restore: noop,
      save: noop,
      scale: noop,
      stroke: paint,
      translate: noop,
    };
    // SAFETY: The renderer exercise only calls the Canvas2D members supplied above.
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
      context as CanvasRenderingContext2D,
    );
    const frames: FrameRequestCallback[] = [];
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
      frames.push(callback);
      return frames.length;
    });
    vi.spyOn(window, "cancelAnimationFrame").mockImplementation(noop);
    const flushFrames = (time: number) => {
      for (const frame of frames.splice(0)) frame(time);
    };
    vi.stubGlobal("matchMedia", (query: string) => ({
      matches: query === "(prefers-reduced-motion: reduce)",
      media: query,
      addEventListener: noop,
      removeEventListener: noop,
    }));
    let onResize: ResizeObserverCallback | undefined;
    class TestResizeObserver {
      constructor(callback: ResizeObserverCallback) {
        onResize = callback;
      }
      observe() {
        /* The test delivers the browser's initial observation explicitly. */
      }
      disconnect() {
        /* Scope cleanup owns it. */
      }
    }
    vi.stubGlobal("ResizeObserver", TestResizeObserver);
    const target = window.document.createElement("div");
    target.style.width = "96px";
    target.style.height = "96px";
    window.document.body.append(target);
    const player = createSprite({
      assets,
      renderers: {},
      characters: {
        mushroom: () =>
          Promise.resolve({
            document: toCharacter(mushroom),
            render: renderZdog,
          }),
      },
    }).mount(target);
    player.set({
      src: { local: "mushroom" },
      activity: "idle",
      expression: "normal",
    });
    await vi.waitFor(() => {
      expect(player.state.status).toBe("ready");
    });
    flushFrames(1000);
    expect(paints).toBeGreaterThan(0);
    // Resizing a canvas backing store erases it. A paused player must still
    // repaint its still frame, or reduced-motion viewers see a blank avatar.
    paints = 0;
    // SAFETY: The callback does not inspect its observer argument.
    onResize?.([], {} as ResizeObserver);
    flushFrames(1100);
    expect(paints).toBeGreaterThan(0);
    // The still frame is one repaint, not a resumed animation loop.
    flushFrames(1200);
    expect(frames).toHaveLength(0);
    await player.dispose();
    target.remove();
  });

  it.each([
    [36, 36, 0.75],
    [48, 48, 1],
    [192, 192, 4],
    [144, 36, 0.75],
  ])(
    "preserves the 48px camera reference at %ix%i",
    async (width, height, zoom) => {
      const scales: [number, number][] = [];
      const noop = () => undefined;
      const context: Partial<CanvasRenderingContext2D> = {
        arc: noop,
        beginPath: noop,
        bezierCurveTo: noop,
        clearRect: noop,
        closePath: noop,
        fill: noop,
        lineTo: noop,
        moveTo: noop,
        restore: noop,
        save: noop,
        stroke: noop,
        translate: noop,
        scale: (x: number, y: number) => scales.push([x, y]),
      };
      // SAFETY: The renderer exercise only calls the Canvas2D members supplied above.
      vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
        context as CanvasRenderingContext2D,
      );
      let frame: FrameRequestCallback | undefined;
      vi.spyOn(window, "requestAnimationFrame").mockImplementation(
        (callback) => {
          frame = callback;
          return 1;
        },
      );
      const target = window.document.createElement("div");
      target.style.width = `${String(width)}px`;
      target.style.height = `${String(height)}px`;
      window.document.body.append(target);
      const player = createSprite({
        assets,
        renderers: {},
        characters: {
          base: () =>
            Promise.resolve({
              document: toCharacter(base),
              render: renderZdog,
            }),
        },
      }).mount(target);
      player.set({ src: { local: "base" } });
      await vi.waitFor(() => {
        expect(player.state.status).toBe("ready");
      });
      frame?.(1000);
      expect(scales).toContainEqual([zoom, zoom]);
      await player.dispose();
      target.remove();
    },
  );
});
