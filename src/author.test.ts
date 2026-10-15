import { describe, expect, it } from "vitest";

import {
  defineSprite,
  type ExpressionSpec,
  type SceneNode,
  type SpriteDefinitionInput,
  type StateGeometry,
} from "./author.js";
import { getDefinitionInternals, type InternalDefinition } from "./internal.js";

type VariantChannels = Record<string, Record<string, SceneNode>>;
const variantChannels = (channels: VariantChannels): VariantChannels =>
  channels;
type MutableDefinitionInput = {
  -readonly [Key in keyof SpriteDefinitionInput]: SpriteDefinitionInput[Key];
};
type RetainedAuthorInternals = InternalDefinition & {
  readonly defaultActivity: string;
};

const retainedInternals = (
  definition: SpriteDefinitionInput,
): RetainedAuthorInternals => {
  // SAFETY: The retained default-activity field is the behavioral contract under test.
  return getDefinitionInternals(definition);
};

const makeDefinition = () =>
  defineSprite({
    apiVersion: 1,
    name: "test",
    palette: { ink: "#000" },
    build({ scene, color }) {
      const root = scene.group({ name: "root" });
      const eyes = scene.group({ parent: root, name: "eyes.normal" });
      scene.ellipse({
        parent: eyes,
        width: 4,
        height: 6,
        color: color("ink"),
        fill: true,
      });
      return { root, variants: { eyes: { normal: eyes } } };
    },
    expressions: { normal: { variants: { eyes: "normal" } } },
    activities: { idle: {}, speaking: { motion: { target: "root" } } },
    defaultPresentation: { activity: "idle", expression: "normal" },
  });

const makeGeometryDefinition = (
  geometry: StateGeometry | undefined,
  expression: ExpressionSpec = {},
  includeBlush = true,
) =>
  (() => {
    const definitionInput: MutableDefinitionInput = {
      apiVersion: 1,
      name: "geometry-validation",
      palette: { ink: "#000" },
      build({ scene, color }) {
        const root = scene.group({ name: "root" });
        const eyes = scene.group({ parent: root, name: "eyes.normal" });
        scene.ellipse({
          parent: eyes,
          width: 1,
          height: 1,
          color: color("ink"),
        });
        const mouth = scene.group({ parent: root, name: "mouth.normal" });
        scene.path({ parent: mouth, path: [{ x: 0, y: 0 }] });
        const variants = variantChannels({
          eyes: { normal: eyes },
          mouth: { normal: mouth },
        });
        if (includeBlush) {
          const blush = scene.group({ parent: root, name: "blush.off" });
          variants.blush = { off: blush };
        }
        return { root, variants };
      },
      expressions: { normal: expression },
    };
    if (geometry !== undefined)
      definitionInput.activities = { custom: { geometry } };
    return defineSprite(definitionInput);
  })();

describe("defineSprite", () => {
  it("defaults to standard idle when only custom activities are declared", () => {
    const definition = defineSprite({
      apiVersion: 1,
      name: "custom-activity-default",
      palette: { ink: "#000" },
      build({ scene }) {
        return { root: scene.group({ name: "root" }) };
      },
      expressions: { normal: {} },
      activities: { dancing: {} },
    });

    expect(retainedInternals(definition).defaultActivity).toBe("idle");
  });

  it("rejects unknown activity geometry references", () => {
    expect(() => makeGeometryDefinition({ expression: "missing" })).toThrow(
      "Unknown Sprite activity.custom.geometry.expression",
    );
    expect(() => makeGeometryDefinition({ eyes: "missing" })).toThrow(
      "Unknown Sprite variant: eyes.missing",
    );
    expect(() => makeGeometryDefinition({ mouth: "missing" })).toThrow(
      "Unknown Sprite variant: mouth.missing",
    );
  });

  it("rejects blush values without their selected variant", () => {
    expect(() => makeGeometryDefinition({ blush: 0 }, {}, false)).toThrow(
      "Unknown Sprite variant channel: blush",
    );
    expect(() => makeGeometryDefinition({ blush: 1 })).toThrow(
      "Unknown Sprite variant: blush.big",
    );
    expect(() =>
      makeGeometryDefinition(undefined, { blush: 0.6 }, false),
    ).toThrow("Unknown Sprite variant channel: blush");
  });

  it("keeps literal activity and expression names", () => {
    const definition = makeDefinition();
    const expression: keyof typeof definition.expressions = "normal";
    expect(Object.keys(definition.expressions)).toEqual([expression]);
    expect(expression).toBe("normal");
  });

  it("returns opaque scene nodes and validates references at definition time", () => {
    let node: SceneNode | undefined;
    const definition = defineSprite({
      apiVersion: 1,
      name: "opaque",
      palette: { ink: "#000" },
      build({ scene, color }) {
        const root = scene.group({ name: "root" });
        node = scene.ellipse({
          parent: root,
          width: 1,
          height: 1,
          color: color("ink"),
        });
        return { root, variants: { body: { default: node } } };
      },
      expressions: { default: { variants: { body: "default" } } },
    });
    expect(definition.name).toBe("opaque");
    expect(node).toBeTruthy();
    expect(() =>
      defineSprite({
        apiVersion: 1,
        name: "bad-palette",
        palette: { ink: "#000" },
        build({ scene, color }) {
          const root = scene.group({ name: "root" });
          scene.ellipse({
            parent: root,
            width: 1,
            height: 1,
            color: color("missing"),
          });
          return { root };
        },
        expressions: { default: {} },
      }),
    ).toThrow("Unknown Sprite palette slot");
  });

  it("rejects duplicate names, unknown variants, and unknown activity targets", () => {
    expect(() =>
      defineSprite({
        apiVersion: 1,
        name: "duplicates",
        palette: { ink: "#000" },
        build({ scene }) {
          const root = scene.group({ name: "root" });
          scene.group({ parent: root, name: "root" });
          return { root };
        },
        expressions: { default: {} },
      }),
    ).toThrow("Duplicate Sprite node name");

    expect(() =>
      defineSprite({
        apiVersion: 1,
        name: "bad-variant",
        palette: { ink: "#000" },
        build({ scene }) {
          return { root: scene.group({ name: "root" }) };
        },
        expressions: { default: { variants: { eyes: "normal" } } },
      }),
    ).toThrow("Unknown Sprite variant channel");

    expect(() =>
      defineSprite({
        apiVersion: 1,
        name: "bad-target",
        palette: { ink: "#000" },
        build({ scene }) {
          return { root: scene.group({ name: "root" }) };
        },
        expressions: { default: {} },
        activities: { idle: { motion: { target: "missing" } } },
      }),
    ).toThrow("Unknown Sprite activity target");
  });

  it("accepts cubic Bezier paths and rejects non-finite control points", () => {
    expect(() =>
      defineSprite({
        apiVersion: 1,
        name: "bezier",
        palette: { ink: "#000" },
        build({ scene, color }) {
          const root = scene.group({ name: "root" });
          scene.path({
            parent: root,
            path: [
              { x: -1, y: 0 },
              {
                bezier: [
                  { x: -0.5, y: 1 },
                  { x: 0.5, y: 1 },
                  { x: 1, y: 0 },
                ],
              },
            ],
            color: color("ink"),
          });
          return { root };
        },
        expressions: { normal: {} },
      }),
    ).not.toThrow();

    expect(() =>
      defineSprite({
        apiVersion: 1,
        name: "bad-bezier",
        palette: { ink: "#000" },
        build({ scene }) {
          const root = scene.group({ name: "root" });
          scene.path({
            parent: root,
            path: [
              {
                bezier: [
                  { x: 0, y: 0 },
                  { x: Number.NaN, y: 1 },
                  { x: 1, y: 0 },
                ],
              },
            ],
          });
          return { root };
        },
        expressions: { normal: {} },
      }),
    ).toThrow("shape.path[0].bezier[1].x");
  });

  it("snapshots author inputs before the runtime can use them", () => {
    const palette = { ink: "#000" };
    const expressions = { normal: { variants: {} } };
    const definition = defineSprite({
      apiVersion: 1,
      name: "snapshot",
      palette,
      build({ scene }) {
        return { root: scene.group({ name: "root" }) };
      },
      expressions,
    });
    palette.ink = "#fff";
    expressions.normal.variants = { eyes: "changed" };
    expect(definition.palette.ink).toBe("#000");
    expect(definition.expressions.normal.variants).toEqual({});
    expect(Object.isFrozen(definition.palette)).toBe(true);
  });
});
