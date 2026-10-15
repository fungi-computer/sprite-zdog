import * as React from "react";
import "./sprite.workbench.css";
import { Sprite } from "@fungi.computer/sprite/react";
import { createSprite } from "@fungi.computer/sprite";
import { toCharacter } from "./portable.js";
import { base, burger, cat, mushroom } from "./builtins/index.js";
import { baseActivities, baseExpressions } from "./builtins/base-face.js";

const catalog = [
  {
    id: "base",
    label: "Base",
    detail: "The original round face",
    definition: base,
  },
  {
    id: "mushroom",
    label: "Mushroom",
    detail: "Soft cap, bright blush",
    definition: mushroom,
  },
  {
    id: "cat",
    label: "Cat",
    detail: "Pointed ears, curious mood",
    definition: cat,
  },
  {
    id: "burger",
    label: "Burger",
    detail: "Stacked layers, big character",
    definition: burger,
  },
] as const;
const service = createSprite({
  assets: {
    baseURL: "https://sprite.invalid/",
    allowedOrigins: [],
    maxBytes: 2_000_000,
    maxTotalBytes: 8_000_000,
    maxRequests: 8,
  },
  renderers: {},
  characters: Object.fromEntries(
    catalog.map((item) => [
      item.id,
      async () => ({
        document: toCharacter(item.definition),
        render: (await import("./index.js")).default,
      }),
    ]),
  ),
});
type CatalogItem = (typeof catalog)[number];
type Expression = keyof typeof baseExpressions;
type Activity = keyof typeof baseActivities;
type Theme = "latte" | "mocha";

const expressionIds = [
  "angry",
  "confused",
  "cute",
  "dead",
  "happy",
  "nervous",
  "normal",
  "pleading",
  "sad",
  "shy",
  "sleepy",
  "surprised",
  "wink",
] as const satisfies readonly Expression[];
const activityIds = [
  "idle",
  "listening",
  "processing",
  "speaking",
  "thinking",
  "error",
] as const satisfies readonly Activity[];
const labelFor = (value: string): string =>
  `${value.slice(0, 1).toUpperCase()}${value.slice(1)}`;
const expressions = expressionIds.map((value) => ({
  value,
  label: labelFor(value),
}));
const activities = activityIds.map((value) => ({
  value,
  label: labelFor(value),
}));
const sizes = [
  { value: "small", label: "96 px", pixels: 96 },
  { value: "medium", label: "160 px", pixels: 160 },
  { value: "large", label: "256 px", pixels: 256 },
] as const;
type Size = (typeof sizes)[number]["value"];
const readExpression = (value: string): Expression =>
  expressions.find((option) => option.value === value)?.value ?? "normal";
const readActivity = (value: string): Activity =>
  activities.find((option) => option.value === value)?.value ?? "idle";

type SpriteViewProps = {
  readonly item: CatalogItem;
  readonly expression: Expression;
  readonly activity: Activity;
  readonly size: Size;
  readonly decorative?: boolean;
  readonly label?: string;
};
const SpriteView = ({
  item,
  expression,
  activity,
  size,
  decorative = false,
  label,
}: SpriteViewProps): React.ReactElement => {
  const sizeOption = sizes.find((option) => option.value === size);
  if (sizeOption === undefined) {
    throw new Error(`Unknown Sprite size: ${size}`);
  }
  const dimensions = sizeOption.pixels;
  if (decorative)
    return (
      <Sprite
        service={service}
        src={{ local: item.id }}
        activity={activity}
        expression={expression}
        aria-hidden="true"
        style={{
          width: `${String(dimensions)}px`,
          height: `${String(dimensions)}px`,
          maxWidth: "100%",
        }}
      />
    );

  return (
    <Sprite
      service={service}
      src={{ local: item.id }}
      activity={activity}
      expression={expression}
      role="img"
      aria-label={
        label ??
        `${item.label} sprite, ${expression} expression, ${activity} activity`
      }
      style={{
        width: `${String(dimensions)}px`,
        height: `${String(dimensions)}px`,
        maxWidth: "100%",
      }}
    />
  );
};

const Gallery = ({
  selected,
  expression,
  activity,
  onSelect,
}: {
  readonly selected: CatalogItem;
  readonly expression: Expression;
  readonly activity: Activity;
  readonly onSelect: (item: CatalogItem) => void;
}): React.ReactElement => (
  <nav aria-label="Built-in sprites" data-sprite-gallery>
    {catalog.map((item) => (
      <button
        className={`btn btn-sm ${item.id === selected.id ? "btn-primary" : "btn-ghost"}`}
        key={item.id}
        type="button"
        aria-pressed={item.id === selected.id}
        onClick={() => {
          onSelect(item);
        }}
      >
        <span className="rounded-box bg-base-200" data-sprite-gallery-avatar>
          <SpriteView
            item={item}
            expression={expression}
            activity={activity}
            size="small"
            decorative
          />
        </span>
        <span>
          <strong className="block">{item.label}</strong>
          <span className="text-xs opacity-70">{item.detail}</span>
        </span>
      </button>
    ))}
  </nav>
);

const Playground = (): React.ReactElement => {
  const [selected, setSelected] = React.useState<CatalogItem>(catalog[1]);
  const [expression, setExpression] = React.useState<Expression>("happy");
  const [activity, setActivity] = React.useState<Activity>("idle");
  const [size, setSize] = React.useState<Size>("medium");
  const [theme, setTheme] = React.useState<Theme>("latte");
  return (
    <div
      className="min-h-screen bg-base-200 text-base-content"
      data-sprite-page
      data-theme={theme}
    >
      <section aria-labelledby="sprite-heading" data-sprite-content>
        <header data-sprite-header>
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-primary">
              Sprite / built-in catalog
            </div>
            <h1
              className="m-0 text-3xl font-semibold tracking-tight"
              id="sprite-heading"
            >
              Sprite
            </h1>
            <p className="m-0 mt-2 max-w-2xl text-sm text-base-content">
              Choose a built-in avatar, then adjust its expression, activity,
              size, and theme.
            </p>
          </div>
          <span className="text-xs font-semibold uppercase tracking-widest text-base-content/60">
            Workbench
          </span>
        </header>
        <div data-sprite-layout>
          <section
            className="card border border-base-300 bg-base-100 shadow-sm"
            aria-label="Sprite preview"
          >
            <div className="grid min-h-72 place-items-center rounded-t-box bg-base-200 p-6">
              <SpriteView
                item={selected}
                expression={expression}
                activity={activity}
                size={size}
              />
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-base-300 px-4 py-3">
              <div>
                <strong>{selected.label}</strong>
                <br />
                <span className="text-xs text-base-content/70">
                  {selected.detail}
                </span>
              </div>
              <span className="text-xs text-base-content/70">
                {expression} · {activity} · {size}
              </span>
            </div>
          </section>
          <section
            className="card border border-base-300 bg-base-100 shadow-sm"
            aria-label="Sprite controls"
          >
            <div className="card-body gap-4 p-4">
              <label className="form-control">
                <span className="label-text text-xs font-semibold uppercase tracking-wide">
                  Expression
                </span>
                <select
                  className="select select-bordered select-sm"
                  id="sprite-expression"
                  value={expression}
                  onChange={(event) => {
                    setExpression(readExpression(event.target.value));
                  }}
                >
                  {expressions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="form-control">
                <span className="label-text text-xs font-semibold uppercase tracking-wide">
                  Activity
                </span>
                <select
                  className="select select-bordered select-sm"
                  id="sprite-activity"
                  value={activity}
                  onChange={(event) => {
                    setActivity(readActivity(event.target.value));
                  }}
                >
                  {activities.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <fieldset>
                <legend className="label-text text-xs font-semibold uppercase tracking-wide">
                  Avatar size
                </legend>
                <div className="join mt-2 w-full" data-sprite-size-options>
                  {sizes.map((option) => (
                    <button
                      className={`btn btn-sm join-item flex-1 ${size === option.value ? "btn-primary" : "btn-ghost"}`}
                      key={option.value}
                      type="button"
                      aria-pressed={size === option.value}
                      onClick={() => {
                        setSize(option.value);
                      }}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </fieldset>
              <fieldset>
                <legend className="label-text text-xs font-semibold uppercase tracking-wide">
                  Theme
                </legend>
                <div className="join mt-2 w-full">
                  {(["latte", "mocha"] as const).map((option) => (
                    <button
                      className={`btn btn-sm join-item flex-1 ${theme === option ? "btn-primary" : "btn-ghost"}`}
                      key={option}
                      type="button"
                      aria-pressed={theme === option}
                      onClick={() => {
                        setTheme(option);
                      }}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </fieldset>
            </div>
          </section>
        </div>
        <Gallery
          selected={selected}
          expression={expression}
          activity={activity}
          onSelect={setSelected}
        />
        <p className="m-0 text-sm text-base-content/70" data-sprite-note>
          Compare the built-ins with the selected expression and activity.
        </p>
      </section>
    </div>
  );
};

type HarnessProps = { readonly decorative?: boolean };
const WorkbenchHarness = ({
  decorative = false,
}: HarnessProps): React.ReactElement => {
  const [mounted, setMounted] = React.useState(true);
  const [presentation, setPresentation] = React.useState<Expression>("normal");
  const [width, setWidth] = React.useState(240);
  return (
    <section
      data-sprite-workbench
      data-mounted={mounted ? "true" : "false"}
      data-width={width}
      style={{ fontFamily: "system-ui, sans-serif", padding: 24 }}
    >
      <div
        data-testid="sprite-resize-target"
        style={{ width: 360, border: "1px solid #ddd", padding: 12 }}
      >
        {mounted ? (
          <Sprite
            data-testid="sprite-canvas"
            service={service}
            src={{ local: "base" }}
            activity="idle"
            expression={presentation}
            {...(decorative
              ? { "aria-hidden": true }
              : { role: "img", "aria-label": "A purple workbench sprite" })}
            style={{
              display: "block",
              width: `${String(width)}px`,
              height: 180,
            }}
          />
        ) : null}
      </div>
      <div
        aria-label="Sprite workbench controls"
        style={{ display: "flex", gap: 8, marginTop: 12 }}
      >
        <button
          type="button"
          data-testid="toggle-mount"
          onClick={() => {
            setMounted((value) => !value);
          }}
        >
          {mounted ? "Unmount sprite" : "Mount sprite"}
        </button>
        <button
          type="button"
          data-testid="present-bright"
          onClick={() => {
            setPresentation("happy");
          }}
        >
          Present bright
        </button>
        <button
          type="button"
          data-testid="present-calm"
          onClick={() => {
            setPresentation("normal");
          }}
        >
          Present calm
        </button>
        <button
          type="button"
          data-testid="resize"
          onClick={() => {
            setWidth((value) => (value === 240 ? 320 : 240));
          }}
        >
          Resize host
        </button>
      </div>
    </section>
  );
};

export default { title: "Sprite" };
export const GalleryPlayground = (): React.ReactElement => <Playground />;
export const Lifecycle = (): React.ReactElement => <WorkbenchHarness />;
export const InformativeCanvas = (): React.ReactElement => <WorkbenchHarness />;
export const DecorativeCanvas = (): React.ReactElement => (
  <WorkbenchHarness decorative />
);
