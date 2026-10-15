import { characterSchema, type LocalCharacter } from "@fungi.computer/sprite";
import document from "./mushroom.character.json" with { type: "json" };
import renderZdog from "./renderer.js";

/** The retained mushroom as one portable character plus its native renderer. */
const mushroomCharacter: LocalCharacter = {
  document: characterSchema.parse(document),
  render: renderZdog,
};

export default mushroomCharacter;
