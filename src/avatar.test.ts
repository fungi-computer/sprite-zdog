import { describe, expect, it } from "vitest";

import {
  avatarCatalog,
  avatarSchema,
  deriveAgentAvatar,
  parseAvatar,
} from "./avatar.js";
import {
  hslFromHex,
  hueDistance,
  seededAvatar,
} from "@fungi.computer/sprite/avatar";
import type { Avatar } from "@fungi.computer/sprite/avatar";

describe("avatarSchema (bound to the built-in catalog)", () => {
  it("accepts the legacy fallback avatar", () => {
    expect(() =>
      avatarSchema.parse(seededAvatar("agent-gardener")),
    ).not.toThrow();
  });

  it("refuses a control the mushroom doesn't have", () => {
    expect(() =>
      parseAvatar({
        v: 1,
        character: "mushroom",
        appearance: { stripes: "#dea38b" },
        expression: "normal",
        renderStyle: "plain",
      }),
    ).toThrow();
  });
});

describe("deriveAgentAvatar for each launch character", () => {
  const cases: {
    readonly character: Avatar["character"];
    readonly slot: string;
  }[] = [
    { character: "mushroom", slot: "cap" },
    { character: "cat", slot: "body" },
    { character: "burger", slot: "topBun" },
  ];

  for (const { character, slot } of cases) {
    it(`shifts ${character}'s identity colour and keeps the rest`, () => {
      const control = avatarCatalog[character].controls[slot];
      if (control?.type !== "color")
        throw new Error(`fixture control missing: ${character}.${slot}`);
      const member: Avatar = {
        v: 1,
        character,
        appearance: { [slot]: control.default },
        expression: avatarCatalog[character].expressions[0] ?? "normal",
        renderStyle: "plain",
      };
      const kept = deriveAgentAvatar(member, "keep", "seed-a");
      expect(kept).toEqual(member);

      const shifted = deriveAgentAvatar(member, "shift", "seed-a");
      expect(shifted.character).toBe(character);
      expect(shifted.expression).toBe(member.expression);
      const before = hslFromHex(control.default).h;
      const after = hslFromHex(shifted.appearance[slot]).h;
      expect(hueDistance(before, after)).toBeGreaterThanOrEqual(40);
    });
  }
});
