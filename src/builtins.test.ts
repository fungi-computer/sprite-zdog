// @vitest-environment jsdom

import { describe, expect, it, vi } from "vitest";
import * as z from "zod";

import { createSprite } from "@fungi.computer/sprite";
import renderZdog from "./index.js";
import { toCharacter } from "./portable.js";
import { getDefinitionInternals } from "./internal.js";
import base from "./builtins/base.js";
import mushroom from "./builtins/mushroom.js";
import cat from "./builtins/cat.js";
import burger from "./builtins/burger.js";
import { baseExpressions } from "./builtins/base-face.js";
import type {
  ActivitySpec,
  ExpressionSpec,
  SpriteDefinition,
} from "./author.js";
import type { InternalDefinition, InternalSceneNode } from "./internal.js";
import { check, defineSprite } from "./author.js";

type RetainedDefinitionInternals = Omit<InternalDefinition, "nodesByName"> & {
  readonly activities: Record<string, ActivitySpec>;
  readonly defaultExpression: string;
  readonly expressions: Record<string, ExpressionSpec>;
  readonly nodesByName: ReadonlyMap<string, RetainedSceneNode>;
};

type RetainedSceneNode = Omit<InternalSceneNode, "children"> & {
  readonly children: RetainedSceneNode[];
  readonly name: string | undefined;
};

const retainedInternals = (
  definition: SpriteDefinition,
): RetainedDefinitionInternals => {
  // SAFETY: These fields are the retained behavioral contract under test.
  return getDefinitionInternals(definition);
};

const activities = [
  "idle",
  "listening",
  "processing",
  "speaking",
  "thinking",
  "error",
] as const;
// SAFETY: baseExpressions is the source object for this retained exhaustive test.
const expressions = Object.keys(
  baseExpressions,
) as (keyof typeof baseExpressions)[];

const noMouth = defineSprite({
  apiVersion: 1,
  name: "no-mouth",
  palette: { body: "#fff" },
  build({ scene, color }) {
    const root = scene.group({ name: "root" });
    scene.ellipse({
      parent: root,
      name: "body",
      width: 2,
      height: 2,
      color: color("body"),
      fill: true,
    });
    return { root };
  },
  expressions: { normal: {} },
});

const mountPortable = async (definition: SpriteDefinition) => {
  const target = document.createElement("div");
  const player = createSprite({
    assets: {
      baseURL: "https://art.example/",
      allowedOrigins: ["https://art.example"],
      maxBytes: 1024,
      maxTotalBytes: 4096,
      maxRequests: 8,
    },
    renderers: {},
    characters: {
      test: () =>
        Promise.resolve({
          document: toCharacter(definition),
          render: renderZdog,
        }),
    },
  }).mount(target);
  player.set({ src: { local: "test" } });
  await vi.waitFor(() => {
    expect(player.state.status).toBe("ready");
  });
  return player;
};

describe("Sprite built-in definitions", () => {
  it.each([
    [base, "ball"],
    [mushroom, "mushroom"],
    [cat, "cat"],
    [burger, "burger"],
  ])("defines %s through the public author seam", (definition, name) => {
    const state = retainedInternals(definition);
    expect(definition.name).toBe(name);
    expect(state.nodesByName.get("root")).toBeTruthy();
    expect(state.nodesByName.get("body")?.options.updateSort).toBe(true);
    expect(Object.keys(state.expressions)).toEqual(
      Object.keys(baseExpressions),
    );
    expect(Object.keys(state.activities)).toEqual([...activities]);
    expect([...state.variants.keys()]).toEqual(
      expect.arrayContaining(["eyes", "mouth", "blush"]),
    );
  });

  it("keeps the base eye variant insertion order stable", () => {
    const state = retainedInternals(base);
    expect([...(state.variants.get("eyes")?.keys() ?? [])]).toEqual([
      "normal",
      "happy",
      "sad",
      "angry",
      "surprised",
      "dead",
      "confused",
      "sleepy",
      "nervous",
      "shy",
      "wink",
      "cute",
      "wink.left",
      "wink.right",
    ]);
  });

  it("keeps mushroom body, cap, spots, face offset and dead error fall", () => {
    const state = retainedInternals(mushroom);
    expect(state.nodesByName.get("body.hemisphere")?.options).toMatchObject({
      diameter: 32,
      translate: { y: 2 },
      stroke: false,
    });
    expect(state.nodesByName.get("cap.hemisphere")?.options).toMatchObject({
      diameter: 42,
      translate: { y: 2 },
      stroke: false,
    });
    expect(state.nodesByName.get("cap.spot.front")?.options.stroke).toBe(12);
    expect(state.nodesByName.get("cap.spot.top")?.options.stroke).toBe(18);
    expect(state.nodesByName.get("face")?.options.translate).toEqual({
      y: 7,
      z: 8,
    });
    expect(state.activities.error).toMatchObject({
      geometry: { eyes: "dead", mouth: "dead" },
      motion: { rotate: { x: 0.9 }, durationMs: 600, repeat: "none" },
    });
    expect(state.defaultExpression).toBe("sleepy");
    expect([...(state.variants.get("blush")?.keys() ?? [])]).toEqual([
      "off",
      "small",
      "medium",
      "big",
    ]);
    // Shiitake never blushes: whichever expression asks for blush, every
    // intensity is the one empty "off" node, with no blush geometry or colour.
    const blushOff = state.nodesByName.get("blush.off");
    for (const node of state.variants.get("blush")?.values() ?? [])
      expect(node).toBe(blushOff);
    expect(blushOff?.children).toHaveLength(0);
    expect(
      [...state.nodesByName.keys()].filter((name) => name.startsWith("blush.")),
    ).toEqual(["blush.off"]);
    expect(Object.keys(state.palette)).not.toContain("blush");
    expect([...(state.variants.get("eyes")?.keys() ?? [])]).toEqual([
      "normal",
      "happy",
      "sad",
      "angry",
      "surprised",
      "dead",
      "confused",
      "sleepy",
      "nervous",
      "shy",
      "wink",
      "cute",
      "wink.left",
      "wink.right",
    ]);
    expect([...(state.variants.get("mouth")?.keys() ?? [])]).toEqual([
      "normal",
      "happy",
      "sad",
      "angry",
      "surprised",
      "dead",
      "small",
      "worried",
      "pout",
      "open",
    ]);
  });

  it("keeps cat ears, whisker lines and custom mouth geometry", () => {
    const state = retainedInternals(cat);
    expect(state.nodesByName.get("body.sphere")?.options.stroke).toBe(32);
    expect(state.nodesByName.get("ear.left")?.options.translate).toEqual({
      x: -9,
      y: -10,
    });
    expect(state.nodesByName.get("ear.right")?.options.translate).toEqual({
      x: 9,
      y: -10,
    });
    expect(
      [...state.nodesByName.keys()].filter((name) =>
        name.startsWith("whisker."),
      ),
    ).toHaveLength(6);
    expect(state.nodesByName.get("cat.mouth")?.options.translate).toEqual({
      y: 6,
      z: 2,
    });
    expect(state.nodesByName.get("cat.mouth.normal")?.options.path).toEqual([
      { x: -2, y: -1 },
      { x: 0, y: 0 },
      { x: 2, y: -1 },
    ]);
    expect(state.nodesByName.get("cat.mouth.open")?.options).toMatchObject({
      width: 4,
      height: 5,
    });
    expect([...(state.variants.get("mouth")?.keys() ?? [])]).toEqual([
      "normal",
      "happy",
      "sad",
      "angry",
      "surprised",
      "dead",
      "small",
      "worried",
      "pout",
      "open",
    ]);
    expect(
      [...state.nodesByName.keys()].filter(
        (name) => name === "mouth" || name.startsWith("mouth."),
      ),
    ).toEqual([]);
  });

  it("keeps burger stack order, surface colors and all registered mouth variants", () => {
    const state = retainedInternals(burger);
    const body = state.nodesByName.get("body");
    expect(body?.children.slice(0, 4).map((child) => child.name)).toEqual([
      "bottom-bun",
      "patty",
      "tomato",
      "top-bun",
    ]);
    expect(state.nodesByName.get("bottom-bun")?.options).toMatchObject({
      diameter: 34,
      length: 6,
      translate: { y: 8 },
      stroke: false,
    });
    expect(state.nodesByName.get("patty")?.options).toMatchObject({
      diameter: 36,
      length: 4,
      translate: { y: 3 },
      stroke: false,
    });
    expect(state.nodesByName.get("tomato")?.options).toMatchObject({
      diameter: 34,
      length: 2,
      translate: { y: -2 },
      stroke: false,
    });
    expect(state.nodesByName.get("top-bun")?.options).toMatchObject({
      diameter: 38,
      translate: { y: -3 },
      stroke: false,
    });
    expect(
      [...state.nodesByName.keys()].filter((name) => name.startsWith("seed.")),
    ).toHaveLength(6);
    expect([...(state.variants.get("mouth")?.keys() ?? [])]).toEqual([
      "normal",
      "happy",
      "sad",
      "angry",
      "surprised",
      "dead",
      "small",
      "worried",
      "pout",
      "open",
    ]);
    expect(state.nodesByName.get("face")?.options.translate).toEqual({
      y: -5,
      z: 16,
    });
    expect(state.nodesByName.get("burger.mouth")?.options.translate).toEqual({
      y: 1,
      z: 10,
    });
    expect(
      [...state.nodesByName.keys()].filter(
        (name) => name === "mouth" || name.startsWith("mouth."),
      ),
    ).toEqual([]);
    expect(state.variants.get("blush")?.get("small")).toBe(
      state.variants.get("blush")?.get("medium"),
    );
    const mediumBlush = state.nodesByName.get("blush.medium");
    expect(mediumBlush?.children).toHaveLength(2);
    expect(mediumBlush?.children.map((node) => node.kind)).toEqual([
      "ellipse",
      "ellipse",
    ]);
    expect(mediumBlush?.children.map((node) => node.options.stroke)).toEqual([
      1, 1,
    ]);
  });

  it.each([[mushroom], [cat], [burger]])(
    "presents every activity/expression for %s",
    async (definition) => {
      vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
      const sprite = await mountPortable(definition);
      for (const activity of activities)
        for (const expression of expressions) {
          sprite.set({ src: { local: "test" }, activity, expression });
          expect(sprite.state.status).toBe("ready");
        }
      await sprite.dispose();
    },
  );

  it("provides author receipts for built-in scenes", () => {
    const receipt = check(burger);
    expect(receipt.name).toBe("burger");
    expect(receipt.nodeCount).toBeTypeOf("number");
    expect(check(noMouth).activities).toEqual([
      "idle",
      "listening",
      "processing",
      "speaking",
      "thinking",
      "error",
    ]);
    expect(receipt.variants.mouth).toEqual([
      "normal",
      "happy",
      "sad",
      "angry",
      "surprised",
      "dead",
      "small",
      "worried",
      "pout",
      "open",
    ]);
  });

  it.each([base, mushroom, cat, burger])(
    "winks %s with one closed eye and one open eye",
    (definition) => {
      const eyes = retainedInternals(definition).variants.get("eyes");
      const offset = z.object({ x: z.number().default(0) }).default({ x: 0 });
      const sides = (node: RetainedSceneNode | undefined) => {
        const left: string[] = [];
        const right: string[] = [];
        const visit = (current: RetainedSceneNode, x: number) => {
          const at = x + offset.parse(current.options.translate).x;
          if (current.kind !== "group" && at !== 0)
            (at < 0 ? left : right).push(current.kind);
          for (const child of current.children) visit(child, at);
        };
        if (node) visit(node, 0);
        return { left, right };
      };
      // A closed eye is an open arc shape; an open eye is a filled ellipse.
      expect(sides(eyes?.get("wink.left"))).toEqual({
        left: ["shape"],
        right: ["ellipse"],
      });
      expect(sides(eyes?.get("wink.right"))).toEqual({
        left: ["ellipse"],
        right: ["shape"],
      });
      expect(eyes?.get("wink")).toBe(eyes?.get("wink.left"));
    },
  );

  it("exposes both wink choices without resetting equal presentation", async () => {
    const wink = retainedInternals(base).expressions.wink;
    if (wink === undefined) throw new Error("Base Sprite is missing wink");
    const choices = wink.variantChoices?.eyes;
    expect(choices).toEqual(["wink.left", "wink.right"]);
    const random = vi.spyOn(Math, "random");
    random.mockReturnValueOnce(0).mockReturnValueOnce(0.999);
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
    const sprite = await mountPortable(base);
    sprite.set({
      src: { local: "test" },
      activity: "idle",
      expression: "wink",
    });
    expect(random).toHaveBeenCalled();
    const calls = random.mock.calls.length;
    sprite.set({
      src: { local: "test" },
      activity: "idle",
      expression: "wink",
    });
    expect(random).toHaveBeenCalledTimes(calls);
    await sprite.dispose();
  });

  it("keeps speaking available for mouthless definitions", async () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
    const sprite = await mountPortable(noMouth);
    sprite.set({
      src: { local: "test" },
      activity: "speaking",
      expression: "normal",
    });
    expect(sprite.state).toMatchObject({
      status: "ready",
      presentation: { activity: "speaking" },
    });
    await sprite.dispose();
  });
});
