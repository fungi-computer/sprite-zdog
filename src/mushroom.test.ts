import { describe, expect, it } from "vitest";
import authoredMushroom from "./builtins/mushroom.js";
import mushroomCharacter from "./mushroom.js";
import { toCharacter } from "./portable.js";

describe("mushroom character", () => {
  it("ships one portable Zdog document through the shared player contract", () => {
    expect(mushroomCharacter.document).toMatchObject({
      name: "mushroom",
      renderer: "zdog",
      version: 1,
    });
    expect(mushroomCharacter.render).toBeTypeOf("function");
  });

  it("keeps the shipped data in sync with the authored mushroom", () => {
    expect(mushroomCharacter.document).toEqual(toCharacter(authoredMushroom));
  });
});
