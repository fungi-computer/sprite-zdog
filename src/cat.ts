import { characterSchema, type LocalCharacter } from "@fungi.computer/sprite";

import cat from "./builtins/cat.js";
import renderZdog from "./renderer.js";
import { toCharacter } from "./portable.js";

/**
 * The cat as one portable character plus its native renderer. Unlike the
 * retained mushroom, this is computed from the builtin at import time rather
 * than a generated JSON file: `toCharacter` is a pure scene-graph walk (no
 * `zdog` import), so there is nothing to keep in sync by hand.
 */
const catCharacter: LocalCharacter = {
  document: characterSchema.parse(toCharacter(cat)),
  render: renderZdog,
};

export default catCharacter;
