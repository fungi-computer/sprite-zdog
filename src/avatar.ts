import * as z from "zod";
import {
  agentColorsSchema,
  createAvatarSchema,
  deriveAgentAvatar as deriveAgentAvatarWithCatalog,
} from "@fungi.computer/sprite/avatar";
import type { AgentColors, Avatar } from "@fungi.computer/sprite/avatar";

import { avatarCatalog } from "./catalog.js";

export { avatarCatalog } from "./catalog.js";

/**
 * The Avatar v1 schema, refined against every built-in character's facts:
 * the one callers should actually parse untrusted data with. (The unrefined
 * envelope lives at `@fungi.computer/sprite/avatar`'s `avatarEnvelopeSchema`,
 * for a caller building a different catalog.)
 */
export const avatarSchema = createAvatarSchema(avatarCatalog);

/** Parse an unknown value into a built-in-character-valid Avatar v1 descriptor. */
export function parseAvatar(data: unknown): Avatar {
  return avatarSchema.parse(data);
}

/**
 * Derive an Agent's avatar from its creator's: `deriveAgentAvatar` bound to
 * the built-in character catalog, so the Hub, Grove's create preview, the
 * TUI and local Agents all compute the same result without each wiring the
 * catalog through themselves.
 */
export function deriveAgentAvatar(
  member: Avatar,
  agentColors: AgentColors,
  seed: string,
  avoid: readonly number[] = [],
): Avatar {
  return deriveAgentAvatarWithCatalog(
    member,
    agentColors,
    seed,
    avatarCatalog,
    avoid,
  );
}

/** A person's saved look and preference for the colours of new Agents. */
export const memberAvatarSchema = z.strictObject({
  avatar: avatarSchema,
  agentColors: agentColorsSchema,
});

/** Catalog-validated account avatar preference. */
export type MemberAvatar = z.infer<typeof memberAvatarSchema>;

/** The uncustomized mascot and default colour-shift preference. */
export const defaultMemberAvatar: MemberAvatar = {
  avatar: {
    v: 1,
    character: "mushroom",
    appearance: {},
    expression: "normal",
    renderStyle: "plain",
  },
  agentColors: "shift",
};
