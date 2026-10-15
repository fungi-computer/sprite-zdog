// @vitest-environment jsdom

import { describe, expect, it } from "vitest";

import base from "./builtins/base.js";
import {
  getDefinitionInternals,
  type InternalDefinition,
  type InternalSceneNode,
} from "./internal.js";
import type {
  ActivitySpec,
  ExpressionSpec,
  SpriteDefinition,
} from "./author.js";

type RetainedDefinitionInternals = InternalDefinition & {
  readonly activities: Record<string, ActivitySpec>;
  readonly defaultActivity: string;
  readonly expressions: Record<string, ExpressionSpec>;
  readonly nodesByName: ReadonlyMap<
    string,
    InternalSceneNode & { readonly name: string | undefined }
  >;
};

const retainedInternals = (
  definition: SpriteDefinition,
): RetainedDefinitionInternals => {
  // SAFETY: These fields are the retained behavioral contract under test.
  return getDefinitionInternals(definition);
};

const internals = () => retainedInternals(base);

describe("base sprite catalog", () => {
  it("keeps the legacy scene seams and all expression variants", () => {
    const state = internals();
    expect(base.name).toBe("ball");
    expect(state.nodesByName.get("body")?.options.updateSort).toBe(true);
    for (const name of ["root", "body", "body.sphere", "face"])
      expect(state.nodesByName.has(name)).toBe(true);

    expect([...(state.variants.get("eyes")?.keys() ?? [])]).toEqual(
      expect.arrayContaining([
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
      ]),
    );
    expect([...(state.variants.get("mouth")?.keys() ?? [])]).toEqual(
      expect.arrayContaining([
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
      ]),
    );
    expect([...(state.variants.get("blush")?.keys() ?? [])]).toEqual(
      expect.arrayContaining(["off", "small", "medium", "big"]),
    );
    expect(Object.keys(state.expressions)).toEqual([
      "angry",
      "confused",
      "cute",
      "dead",
      "happy",
      "nervous",
      "normal",
      "pleading",
      "sad",
      "shy",
      "sleepy",
      "surprised",
      "wink",
    ]);
    expect(Object.keys(state.activities)).toEqual([
      "idle",
      "listening",
      "processing",
      "speaking",
      "thinking",
      "error",
    ]);
  });

  it("can present every standard activity with every base expression", () => {
    const state = internals();
    const expressions = Object.keys(state.expressions);
    const activities = [
      "idle",
      "listening",
      "processing",
      "speaking",
      "thinking",
      "error",
    ] as const;
    expect(expressions).toHaveLength(13);
    expect(activities).toHaveLength(6);
  });
});
