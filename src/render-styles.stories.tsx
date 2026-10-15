import { builtinCharacters } from "./index.js";
import {
  createSprite,
  renderStyleLabels,
  renderStyles,
} from "@fungi.computer/sprite";
import { Sprite } from "@fungi.computer/sprite/react";

const service = createSprite({
  characters: builtinCharacters,
});

export default { title: "Sprite / Render styles" };

/** Shiitake in every render style, on the current theme's paper. */
export const AllStyles = () => (
  <main
    style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(11rem, 1fr))",
      gap: "1rem",
      padding: "1.5rem",
      minHeight: "100vh",
      alignContent: "start",
      background: "var(--color-base-200)",
      color: "var(--color-base-content)",
    }}
  >
    {renderStyles.map((style) => (
      <figure
        key={style}
        data-render-style={style}
        style={{
          margin: 0,
          padding: "0.75rem",
          borderRadius: "var(--radius-box)",
          background: "var(--color-base-100)",
          border: "1px solid var(--color-base-300)",
        }}
      >
        <Sprite
          service={service}
          src={{ local: "mushroom" }}
          activity="idle"
          expression="happy"
          renderStyle={style}
          role="img"
          aria-label={`Shiitake drawn in ${renderStyleLabels[style]} style`}
          data-testid={`render-style-${style}`}
          style={{ width: "100%", aspectRatio: "1" }}
        />
        <figcaption style={{ textAlign: "center", fontWeight: 600 }}>
          {renderStyleLabels[style]}
        </figcaption>
      </figure>
    ))}
  </main>
);
