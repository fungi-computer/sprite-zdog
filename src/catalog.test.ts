import { characterSchema } from "@fungi.computer/sprite";
import { avatarCharacters } from "@fungi.computer/sprite/avatar";
import { describe, expect, it } from "vitest";

import { burger, cat } from "./builtins/index.js";
import { avatarCatalog } from "./catalog.js";
import { zdogDocumentSchema } from "./document.js";
import mushroomDocument from "./mushroom.character.json" with { type: "json" };
import { toCharacter } from "./portable.js";

describe("avatarCatalog", () => {
  it("pins the mushroom's controls and expressions to the shipped document, not the builtin it was generated from", () => {
    // mushroom.ts renders from mushroom.character.json, not the builtin
    // (mushroom.ts:2); nothing else ties that file to builtins/mushroom.js,
    // so the catalog must be checked against the same document the renderer
    // actually uses, not a second computation of the same builtin.
    const shipped = characterSchema.parse(mushroomDocument);
    const scene = zdogDocumentSchema.parse(shipped.data);
    expect(avatarCatalog.mushroom.controls).toEqual(shipped.controls);
    expect(avatarCatalog.mushroom.expressions).toEqual(
      Object.keys(scene.expressions),
    );
  });

  it("pins the cat and burger controls and expressions to their document", () => {
    // Unlike the mushroom, cat and burger are both built live from the same
    // authoring input the catalog itself reads (catalog.ts defines it lazily;
    // cat.ts and burger.ts call toCharacter() on the builtin defined from it),
    // so there is no second, independently shipped document to pin against;
    // this still catches catalog.ts's own computation diverging from the
    // builtin definition.
    for (const [character, builtin] of [
      ["cat", cat],
      ["burger", burger],
    ] as const) {
      const document = toCharacter(builtin);
      const scene = zdogDocumentSchema.parse(document.data);
      expect(avatarCatalog[character].controls).toEqual(document.controls);
      expect(avatarCatalog[character].expressions).toEqual(
        Object.keys(scene.expressions),
      );
    }
  });

  it("gives every character's identity slots as real controls", () => {
    for (const character of avatarCharacters) {
      const entry = avatarCatalog[character];
      expect(entry.identitySlots.length).toBeGreaterThan(0);
      for (const slot of entry.identitySlots) {
        expect(entry.controls[slot]).toBeDefined();
        expect(entry.controls[slot]?.type).toBe("color");
      }
    }
  });

  it("matches the plan's launch characters and identity slots", () => {
    expect(avatarCatalog.mushroom.identitySlots).toEqual(["cap", "capSpot"]);
    expect(avatarCatalog.cat.identitySlots).toEqual(["body", "stripes"]);
    expect(avatarCatalog.burger.identitySlots).toEqual(["topBun", "bottomBun"]);
  });

  it("gives the mushroom 10 colour controls and 13 expressions", () => {
    expect(Object.keys(avatarCatalog.mushroom.controls)).toHaveLength(10);
    expect(avatarCatalog.mushroom.expressions).toHaveLength(13);
  });
});
