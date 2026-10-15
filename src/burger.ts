import { characterSchema, type LocalCharacter } from "@fungi.computer/sprite";

import burger from "./builtins/burger.js";
import renderZdog from "./renderer.js";
import { toCharacter } from "./portable.js";

/**
 * The burger as one portable character plus its native renderer. Unlike the
 * retained mushroom, this is computed from the builtin at import time rather
 * than a generated JSON file: `toCharacter` is a pure scene-graph walk (no
 * `zdog` import), so there is nothing to keep in sync by hand.
 */
const burgerCharacter: LocalCharacter = {
  document: characterSchema.parse(toCharacter(burger)),
  render: renderZdog,
};

export default burgerCharacter;
