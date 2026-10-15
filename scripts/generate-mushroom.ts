import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import mushroom from "../src/builtins/mushroom.js";
import { toCharacter } from "../src/portable.js";

const destination = fileURLToPath(
  new URL("../src/mushroom.character.json", import.meta.url),
);

await writeFile(
  destination,
  `${JSON.stringify(toCharacter(mushroom), null, 2)}\n`,
);
