import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { check } from "@fungi.computer/sprite-zdog/author";
import type { SpriteDefinition } from "@fungi.computer/sprite-zdog/author";
import ball from "@fungi.computer/sprite-zdog/builtins/base";
import mushroom from "@fungi.computer/sprite-zdog/builtins/mushroom";
import cat from "@fungi.computer/sprite-zdog/builtins/cat";
import burger from "@fungi.computer/sprite-zdog/builtins/burger";
import * as catalog from "@fungi.computer/sprite-zdog/builtins";

const builtins: readonly (readonly [string, SpriteDefinition])[] = [
  ["base", ball],
  ["mushroom", mushroom],
  ["cat", cat],
  ["burger", burger],
] as const;

describe("public built-in export map", () => {
  it("resolves each definition subpath and the catalog", () => {
    expect([ball, mushroom, cat, burger]).toEqual([
      catalog.base,
      catalog.mushroom,
      catalog.cat,
      catalog.burger,
    ]);
  });

  it.each(builtins)(
    "%s is authored through the public scene builder seam",
    (name, definition) => {
      const source = readFileSync(
        resolve(process.cwd(), `src/builtins/${name}.ts`),
        "utf8",
      );

      expect(source).toContain('from "../author.js"');
      expect(source).toMatch(/\bdefineSprite\s*\(/);
      expect(source).not.toMatch(
        /from "\.\.\/(?:internal|zdog-runtime|geometry)(?:\.js)?"/,
      );

      expect(check(definition)).toMatchObject({
        valid: true,
        name: definition.name,
      });
    },
  );
});
