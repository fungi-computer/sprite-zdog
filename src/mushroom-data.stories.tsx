import { builtinCharacters } from "./index.js";
import { useState } from "react";
import { createSprite, type PlayerState } from "@fungi.computer/sprite";
import { Sprite } from "@fungi.computer/sprite/react";
import { zdogDocumentSchema } from "./document.js";

const activities = ["idle", "thinking", "speaking", "error"] as const;
const service = createSprite({
  characters: builtinCharacters,
});

export default { title: "Sprite / Data" };

export const ShippedMushroom = () => {
  const [activity, setActivity] = useState<(typeof activities)[number]>("idle");
  const [state, setState] = useState<PlayerState>({ status: "empty" });
  const document = state.status === "ready" ? state.document : undefined;
  const scene = document ? zdogDocumentSchema.parse(document.data) : undefined;
  const excerpt =
    document && scene
      ? {
          version: document.version,
          name: document.name,
          renderer: document.renderer,
          controls: Object.keys(document.controls),
          data: {
            root: scene.root,
            nodes: scene.nodes.slice(0, 2),
            defaultPresentation: scene.defaultPresentation,
          },
        }
      : undefined;

  return (
    <main
      style={{
        maxWidth: 960,
        margin: "40px auto",
        padding: 24,
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <h1 style={{ fontSize: 28, fontWeight: 700 }}>
        Shipped mushroom document
      </h1>
      <p>
        This story loads <code>sprite-zdog/mushroom</code>. That production
        entry imports <code>mushroom.character.json</code>, validates it, and
        hands it to the Zdog renderer. No authoring definition is used here.
      </p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(220px, 1fr) minmax(300px, 1fr)",
          gap: 24,
        }}
      >
        <section aria-label="Live data-driven mushroom">
          <Sprite
            service={service}
            src={{ local: "mushroom" }}
            activity={activity}
            role="img"
            aria-label={`Mushroom avatar, ${activity}`}
            onState={setState}
            data-testid="shipped-mushroom-avatar"
            style={{ width: "100%", aspectRatio: "1" }}
          />
          <div
            style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}
          >
            {activities.map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={activity === option}
                onClick={() => {
                  setActivity(option);
                }}
                style={{
                  padding: "8px 12px",
                  border: "1px solid #51596c",
                  borderRadius: 6,
                  background: activity === option ? "#303446" : "#fff",
                  color: activity === option ? "#fff" : "#303446",
                  cursor: "pointer",
                  textTransform: "capitalize",
                }}
              >
                {option}
              </button>
            ))}
          </div>
        </section>
        <section aria-label="Loaded document">
          <p data-testid="shipped-mushroom-status">Player: {state.status}</p>
          <p>Activity: {activity}</p>
          {scene && document ? (
            <>
              <p data-testid="shipped-mushroom-counts">
                {scene.nodes.length} scene nodes ·{" "}
                {Object.keys(document.controls).length} controls
              </p>
              <pre
                data-testid="shipped-mushroom-document"
                style={{
                  overflow: "auto",
                  maxHeight: 520,
                  padding: 16,
                  background: "#252631",
                  color: "#f4f5fa",
                  fontSize: 12,
                }}
              >
                {JSON.stringify(excerpt, null, 2)}
              </pre>
            </>
          ) : null}
        </section>
      </div>
    </main>
  );
};
