import { expect, it } from "vitest";
import renderZdog, { builtinCharacters } from "./index.js";

it("loads each bundled local character with the shared renderer", async () => {
  const mushroom = await builtinCharacters.mushroom();
  const cat = await builtinCharacters.cat();
  const burger = await builtinCharacters.burger();
  expect([
    mushroom.document.name,
    cat.document.name,
    burger.document.name,
  ]).toEqual(["mushroom", "cat", "burger"]);
  for (const character of [mushroom, cat, burger]) {
    expect(character.document.renderer).toBe("zdog");
    expect(character.render).toBe(renderZdog);
  }
  expect(Object.isFrozen(builtinCharacters)).toBe(true);
});
