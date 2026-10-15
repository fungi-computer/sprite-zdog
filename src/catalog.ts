import {
  type AvatarCatalog,
  type AvatarCatalogEntry,
  type AvatarCharacter,
} from "@fungi.computer/sprite/avatar";

import { defineSprite } from "./author.js";
import { burgerInput } from "./builtins/burger-input.js";
import { catInput } from "./builtins/cat-input.js";
import { mushroomInput } from "./builtins/mushroom-input.js";
import { zdogDocumentSchema } from "./document.js";
import { toCharacter } from "./portable.js";

/**
 * Controls that carry each character's identity colour, in priority order.
 * The first slot is the one a rendered preview (and `deriveAgentAvatar`'s
 * hue search) treats as "the" identity colour.
 */
const identitySlots = {
  mushroom: ["cap", "capSpot"],
  cat: ["body", "stripes"],
  burger: ["topBun", "bottomBun"],
} satisfies Readonly<Record<AvatarCharacter, readonly string[]>>;

const inputs = { mushroom: mushroomInput, cat: catInput, burger: burgerInput };

/**
 * This never imports `zdog`: `toCharacter` only walks the renderer-neutral
 * scene graph authored by `defineSprite`, so a Hub (or anywhere else that
 * only needs to validate an avatar) can import this catalog without pulling
 * in a canvas renderer.
 */
function catalogEntryFor(character: AvatarCharacter): AvatarCatalogEntry {
  const document = toCharacter(defineSprite(inputs[character]));
  const scene = zdogDocumentSchema.parse(document.data);
  return {
    controls: document.controls,
    expressions: Object.keys(scene.expressions),
    identitySlots: identitySlots[character],
  };
}

const entries = new Map<AvatarCharacter, AvatarCatalogEntry>();

/**
 * Building, walking and parsing a character is real work, and the Hub and
 * State Workers import this catalog on their cold-start path only to build an
 * avatar schema. The catalog therefore imports each character's authoring
 * input rather than its eager `builtins/*` definition, and each entry is
 * defined, derived on first read and memoised, so module evaluation stays
 * cheap and only a request that validates an avatar pays for the character
 * it names.
 */
function entry(character: AvatarCharacter): AvatarCatalogEntry {
  let found = entries.get(character);
  if (!found) {
    found = catalogEntryFor(character);
    entries.set(character, found);
  }
  return found;
}

/** Pure per-character facts for every v1 avatar character. No `zdog` import. */
export const avatarCatalog: AvatarCatalog = Object.freeze({
  get mushroom() {
    return entry("mushroom");
  },
  get cat() {
    return entry("cat");
  },
  get burger() {
    return entry("burger");
  },
});
