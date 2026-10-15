# Sprite Zdog (`@fungi.computer/sprite-zdog`)

Sprite Zdog is an optional Canvas renderer for characters built with Zdog. It
also provides built-in characters and tools for authoring a portable character
document that [Sprite](../sprite/README.md) can load.

## Install or set up

```sh
npm install @fungi.computer/sprite-zdog
```

The package ships ESM only and depends on Effect, Zod, `animejs`, `zdog`, and
[Sprite](../sprite/README.md) at runtime. Add it only to a host that already
uses Sprite and renders with Zdog. The parent Sprite host still owns the player
and asset policy. The root entrypoint exports the Zdog renderer. `./author` and
`./portable` support scene authoring. `./builtins` (and the individual
`./builtins/base`, `./builtins/mushroom`, `./builtins/cat`, and
`./builtins/burger` subpaths) expose the bundled authoring definitions.
`./mushroom`, `./cat` and `./burger` provide ready-to-load local characters,
each with its document and renderer. `./catalog` and `./avatar` provide pure
avatar validation and derivation without importing the Canvas renderer.

## Quick start

This illustrative example installs the bundled mushroom as a local character and
renders it with the Sprite React component:

```tsx
import { createSprite } from "@fungi.computer/sprite";
import { Sprite } from "@fungi.computer/sprite/react";
import { builtinCharacters } from "@fungi.computer/sprite-zdog";

const service = createSprite({
  characters: builtinCharacters,
});

function Character() {
  return (
    <Sprite
      service={service}
      src={{ local: "mushroom" }}
      activity="thinking"
      role="img"
      aria-label="Mushroom character"
    />
  );
}
```

`builtinCharacters` provides lazy `mushroom`, `cat` and `burger` loaders without
remote asset access. The bundled character supplies its document and Zdog
renderer together. The tests cover built-in characters and player integration in
[`src/builtins.test.ts`](src/builtins.test.ts) and
[`src/mushroom.test.ts`](src/mushroom.test.ts).

## Core concepts

The package root exports the Zdog renderer as the default export. To render a
served character document whose `renderer` is `zdog`, register it with Sprite.
This illustrative configuration uses `assetPolicy` as the host's configured
Sprite asset policy:

```ts
const service = createSprite({
  assets: assetPolicy,
  renderers: {
    zdog: () => import("@fungi.computer/sprite-zdog"),
  },
});
```

`assetPolicy` stands for the host's configured Sprite asset policy. Admit the
document's origin and set its byte and request limits. A local character does
not need remote asset access.

For authoring, `defineSprite` validates a trusted scene definition, `check`
returns a compact author-time summary, and `toCharacter` converts the definition
into a JSON character document. The resulting document contains data, not
executable authoring code. `@fungi.computer/sprite-zdog/builtins` exports the
base, mushroom, cat, and burger characters.

For stored avatars, import `avatarSchema` or `parseAvatar(data)` from
`@fungi.computer/sprite-zdog/avatar`. These validate against the built-in
character controls and expressions, rather than checking only the envelope.
`deriveAgentAvatar(member, agentColors, seed, avoid?)` uses that same catalog;
`agentColors` is `"keep"` or `"shift"`. `avatarCatalog` is also available from
`./catalog` for callers using Sprite's catalog-parameterized helpers.
`memberAvatarSchema` validates the strict `{avatar, agentColors}` preference;
`defaultMemberAvatar` supplies the uncustomized mushroom with colour shift on.

## API reference

See the generated [package API](docs/api/README.md),
[authoring API](docs/api/author.md), and
[portable document API](docs/api/portable.md). The package also exposes
individual built-ins through `@fungi.computer/sprite-zdog/builtins/<name>`.

## Examples and checks

The local Sprite stories live in `src/*.stories.tsx`. Run the package tests
with:

```sh
pnpm --filter @fungi.computer/sprite-zdog test
```

The authoring and portable-runtime tests cover definition validation,
serialization, decoding, and cleanup.

## Limits and errors

The Zdog renderer requires a browser window and canvas. It decodes the
character's Zdog data before creating a renderer and removes its canvas and
animation resources when the player selection closes. Invalid scene data,
missing expressions, or invalid palette colors fail the selection.

The authoring callback is trusted code that runs while creating the portable
document. Runtime rendering reads the resulting JSON data. It does not execute
the authoring callback. Served documents still use Sprite's host-owned origin
and asset limits.

## Contribute and license

Sprite Zdog is MIT licensed. See [`LICENSE`](LICENSE) and
[`THIRD_PARTY_NOTICES`](THIRD_PARTY_NOTICES).
