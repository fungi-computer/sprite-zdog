export { default } from "./renderer.js";

/** Lazy loaders for the bundled local characters; no remote asset access. */
export const builtinCharacters = Object.freeze({
  /** Load the bundled mushroom document and renderer. */
  mushroom: () =>
    import("./mushroom.js").then(({ default: character }) => character),
  /** Load the bundled cat document and renderer. */
  cat: () => import("./cat.js").then(({ default: character }) => character),
  /** Load the bundled burger document and renderer. */
  burger: () =>
    import("./burger.js").then(({ default: character }) => character),
});
