import mushroom from "@fungi.computer/sprite-zdog/mushroom";
import renderZdog, { builtinCharacters } from "@fungi.computer/sprite-zdog";

if (mushroom.document.renderer !== "zdog" || mushroom.render !== renderZdog) {
  throw new Error("Packed Zdog character contract is missing");
}

for (const [name, load] of Object.entries(builtinCharacters)) {
  const character = await load();
  if (character.document.name !== name || character.render !== renderZdog)
    throw new Error(`Invalid packed character ${name}`);
}
