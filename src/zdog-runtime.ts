import {
  createTimeline,
  createTimer,
  type Timeline,
  type Timer,
} from "animejs";
import * as Zdog from "zdog";

import type { ZdogDocument } from "./document.js";
import { colorKeyFromValue } from "./palette.js";

type ActivitySpec = ZdogDocument["activities"][string];
type ExpressionSpec = ZdogDocument["expressions"][string];
type MotionSpec = NonNullable<ActivitySpec["motion"]>;
type Transform = NonNullable<MotionSpec["translate"]>;
type Mutable<T> = { -readonly [Key in keyof T]: T[Key] };
type SceneNode = {
  readonly kind: ZdogDocument["nodes"][number]["kind"];
  readonly name: string | undefined;
  readonly options: ZdogDocument["nodes"][number]["options"];
  readonly children: SceneNode[];
};
type SceneIndex = {
  readonly root: SceneNode;
  readonly nodesByName: ReadonlyMap<string, SceneNode>;
  readonly variants: ReadonlyMap<string, ReadonlyMap<string, SceneNode>>;
  readonly palette: Record<string, string>;
  readonly activities: ZdogDocument["activities"];
  readonly expressions: ZdogDocument["expressions"];
};

type RendererPresentation = {
  readonly activity: string;
  readonly expression: string;
};

export type SpriteRenderer = {
  present(presentation: {
    readonly activity: string;
    readonly expression: string;
  }): void;
  setPalette(palette: Readonly<Record<string, string>>): void;
  pause(paused: boolean): void;
  tick(timestamp: number): boolean;
  /** Draw pending changes now, unthrottled, as a paused player's still frame. */
  renderStill(): void;
  resize(): void;
  destroy(): void;
};

type RuntimeOptions = {
  readonly target: HTMLCanvasElement;
  readonly scene: ZdogDocument;
  readonly onInvalidate: () => void;
  readonly maxPixels: number;
  readonly palette?: Partial<Record<string, string>>;
};

type ActivityDefaults = ReadonlyMap<string, ActivitySpec>;

const STANDARD_ACTIVITY_DEFAULTS: ActivityDefaults = new Map([
  [
    "idle",
    {
      geometry: {},
      motion: {
        target: "root",
        translate: { y: 0.5 },
        durationMs: 2000,
        repeat: "yoyo",
      },
      mouseInfluence: 1,
    },
  ],
  [
    "listening",
    {
      geometry: {},
      motion: {
        target: "root",
        rotate: { x: -0.2 },
        durationMs: 300,
        repeat: "yoyo",
      },
      mouseInfluence: 0.3,
    },
  ],
  ["processing", { geometry: {}, mouseInfluence: 0.2 }],
  [
    "speaking",
    {
      geometry: {},
      motion: {
        target: "root",
        translate: { y: 0.5 },
        durationMs: 1500,
        repeat: "yoyo",
      },
      mouseInfluence: 0,
      mouthCycle: [
        { durationMs: 100, mouth: "open" },
        { durationMs: 150, mouth: "base" },
        { durationMs: 100, mouth: "open" },
        { durationMs: 200, mouth: "base" },
      ],
    },
  ],
  [
    "thinking",
    {
      geometry: {},
      motion: {
        target: "root",
        rotate: { z: 0.1 },
        durationMs: 800,
        repeat: "yoyo",
      },
      mouseInfluence: 0,
    },
  ],
  [
    "error",
    {
      geometry: { expression: "dead" },
      mouseInfluence: 0.1,
    },
  ],
]);

// Built-in geometry was authored against the old 48 CSS-pixel avatar cell.
// Keep camera framing renderer-owned so every host scales the same scene rather
// than learning a private Zdog camera knob.
const SPRITE_REFERENCE_CSS_SIZE = 48;

const framingZoom = (width: number, height: number): number =>
  Math.min(width, height) / SPRITE_REFERENCE_CSS_SIZE;

const positiveDevicePixelRatio = (value: number | undefined): number =>
  value !== undefined && value > 0 ? value : 1;

const boundedSize = (
  width: number,
  height: number,
  maxPixels: number,
  devicePixelRatio: number,
): [number, number] => {
  const ratio = Math.min(
    1,
    Math.sqrt(
      maxPixels / (width * height * devicePixelRatio * devicePixelRatio),
    ),
  );
  return [
    Math.max(1, Math.floor(width * ratio)),
    Math.max(1, Math.floor(height * ratio)),
  ];
};

const finite = (value: number, label: string): void => {
  if (!Number.isFinite(value))
    throw new Error(`Sprite ${label} must be finite`);
};

const readDimension = (
  target: HTMLCanvasElement,
  axis: "width" | "height",
): number => {
  const view = target.ownerDocument.defaultView;
  const computed = view?.getComputedStyle(target);
  const computedSize = computed?.[axis] ?? "";
  const cssValue = Number.parseFloat(computedSize);
  if (cssValue > 0 && computedSize.trim().endsWith("px")) return cssValue;
  const inlineValue = target.style[axis];
  const inlineCssValue = Number.parseFloat(inlineValue);
  if (inlineCssValue > 0 && inlineValue.trim().endsWith("px"))
    return inlineCssValue;
  const rect = target.getBoundingClientRect();
  const rectValue = axis === "width" ? rect.width : rect.height;
  if (rectValue > 0) return rectValue;
  for (
    let parent = target.parentElement;
    parent;
    parent = parent.parentElement
  ) {
    const parentSize = view?.getComputedStyle(parent)[axis];
    const parentValue = Number.parseFloat(parentSize ?? "");
    if (parentValue > 0 && parentSize?.trim().endsWith("px"))
      return parentValue;
  }
  return target[axis] || 48;
};

type RendererVector = { x?: number; y?: number; z?: number };

const transform = (value: Transform | undefined): RendererVector => {
  if (!value) return {};
  const result: RendererVector = {};
  if (value.x !== undefined) result.x = value.x;
  if (value.y !== undefined) result.y = value.y;
  if (value.z !== undefined) result.z = value.z;
  return result;
};

const valueForBlush = (value: number | undefined): string => {
  if (!value) return "off";
  if (value <= 0.5) return "small";
  if (value <= 0.8) return "medium";
  return "big";
};

/** Build renderer indexes from validated portable data, without author objects. */
const indexScene = (scene: ZdogDocument): SceneIndex => {
  const nodes = new Map<string, SceneNode>();
  const nodesByName = new Map<string, SceneNode>();
  for (const entry of scene.nodes) {
    const parent =
      entry.parent === undefined ? undefined : nodes.get(entry.parent);
    const node: SceneNode = {
      kind: entry.kind,
      name: entry.options.name,
      children: [],
      options: entry.options,
    };
    nodes.set(entry.id, node);
    if (node.name) nodesByName.set(node.name, node);
    parent?.children.push(node);
  }
  const root = nodes.get(scene.root);
  if (!root) throw new Error("Portable Zdog scene has no root");
  const variants = new Map<string, Map<string, SceneNode>>();
  for (const [channel, values] of Object.entries(scene.variants)) {
    const channelNodes = new Map<string, SceneNode>();
    for (const [name, id] of Object.entries(values)) {
      const node = nodes.get(id);
      if (!node)
        throw new Error(`Portable Zdog variant node is missing: ${id}`);
      channelNodes.set(name, node);
    }
    variants.set(channel, channelNodes);
  }
  return {
    root,
    nodesByName,
    variants,
    palette: scene.palette,
    activities: scene.activities,
    expressions: scene.expressions,
  };
};

class ZdogSpriteRenderer implements SpriteRenderer {
  private readonly internals;
  private readonly target: HTMLCanvasElement;
  private readonly view: Window | null;
  private readonly onInvalidate: () => void;
  private readonly maxPixels: number;
  private readonly originalStyle: string | null;
  private readonly originalHasInlineWidth: boolean;
  private readonly originalHasInlineHeight: boolean;
  private readonly originalWidthAttribute: string | null;
  private readonly originalHeightAttribute: string | null;
  private readonly illustration: Zdog.Illustration;
  private readonly avatar: Zdog.Group;
  private readonly animationPivot: Zdog.Group;
  private readonly items = new Map<SceneNode, Zdog.SceneObject>();
  private readonly variantItems = new Map<
    string,
    Map<string, Zdog.SceneObject>
  >();
  private readonly palette: Record<string, string>;
  private readonly mouseListener: (event: MouseEvent) => void;
  private readonly resizeObserver: ResizeObserver;
  private animationTween: Timeline | null = null;
  private mouthCycleTimeline: Timer | null = null;
  private entryTween: Timeline | null = null;
  private mouseX = 0;
  private mouseY = 0;
  private mouseInfluence = 1;
  private dirty = true;
  private destroyed = false;
  private paused = false;
  private lastRenderTime = 0;

  constructor({
    target,
    scene,
    onInvalidate,
    palette,
    maxPixels,
  }: RuntimeOptions) {
    this.target = target;
    this.view = target.ownerDocument.defaultView;
    this.onInvalidate = onInvalidate;
    this.maxPixels = maxPixels;
    this.originalStyle = target.getAttribute("style");
    this.originalHasInlineWidth = target.style.width !== "";
    this.originalHasInlineHeight = target.style.height !== "";
    this.originalWidthAttribute = target.getAttribute("width");
    this.originalHeightAttribute = target.getAttribute("height");
    this.internals = indexScene(scene);
    this.palette = { ...this.internals.palette };
    for (const [key, value] of Object.entries(palette ?? {})) {
      if (!(key in this.internals.palette))
        throw new Error(`Unknown Sprite palette slot: ${key}`);
      if (value !== undefined) this.palette[key] = value;
    }

    // Zdog reads the backing-store attributes while constructing the
    // illustration. Measure the authored CSS box before replacing the backing
    // store so remounts never compound a previous device-pixel-ratio multiplier.
    const cssWidth = readDimension(target, "width");
    const cssHeight = readDimension(target, "height");
    const [width, height] = boundedSize(
      cssWidth,
      cssHeight,
      maxPixels,
      positiveDevicePixelRatio(this.view?.devicePixelRatio),
    );
    target.width = Math.round(width);
    target.height = Math.round(height);
    this.illustration = new Zdog.Illustration({
      element: target,
      resize: false,
      zoom: framingZoom(width, height),
    });
    this.illustration.setSize(width, height);
    this.preserveCanvasStyle(cssWidth, cssHeight);
    this.avatar = new Zdog.Group({
      addTo: this.illustration,
      rotate: { x: -Zdog.TAU / 1.05 },
    });
    this.animationPivot = new Zdog.Group({ addTo: this.avatar });
    this.createScene(this.internals.root, this.animationPivot);
    this.indexVariants();

    this.mouseListener = (event) => {
      this.onMouseMove(event);
    };
    this.view?.addEventListener("mousemove", this.mouseListener);
    const ResizeObserverCtor = globalThis.ResizeObserver;
    this.resizeObserver = new ResizeObserverCtor(() => {
      if (!this.destroyed) this.resize();
    });
    try {
      this.resizeObserver.observe(target);
      this.present({
        activity: scene.defaultPresentation.activity,
        expression: scene.defaultPresentation.expression,
      });
    } catch (error) {
      this.stopAnimations();
      this.view?.removeEventListener("mousemove", this.mouseListener);
      this.resizeObserver.disconnect();
      throw error;
    }
  }

  present(presentation: RendererPresentation): void {
    this.assertAlive();
    if (!(presentation.expression in this.internals.expressions))
      throw new Error(`Unknown Sprite expression: ${presentation.expression}`);
    if (
      !(presentation.activity in this.internals.activities) &&
      !STANDARD_ACTIVITY_DEFAULTS.has(presentation.activity)
    )
      throw new Error(`Unknown Sprite activity: ${presentation.activity}`);
    this.stopAnimations();
    const activity = this.activitySpec(presentation.activity);
    const expression = this.internals.expressions[presentation.expression];
    const effectiveExpression =
      activity.geometry?.expression ?? presentation.expression;
    const effective =
      this.internals.expressions[effectiveExpression] ?? expression;
    this.mouseInfluence = activity.mouseInfluence ?? 1;
    this.applyVariants(effective, activity.geometry);
    this.resetPivot();
    if (activity.motion) this.startMotion(activity.motion, true);
    if (effective?.motion) this.startMotion(effective.motion, false);
    if (activity.mouthCycle && this.internals.variants.get("mouth")?.size)
      this.startMouthCycle(activity.mouthCycle, effective);
    this.dirty = true;
    this.pause(this.paused);
  }

  setPalette(palette: Readonly<Record<string, string>>): void {
    this.assertAlive();
    for (const key of Object.keys(palette)) {
      if (!Object.hasOwn(this.internals.palette, key))
        throw new Error(`Unknown Sprite palette slot: ${key}`);
    }
    Object.assign(this.palette, this.internals.palette, palette);
    for (const [node, item] of this.items) {
      for (const property of ["color", "backface", "frontFace"] as const) {
        const value = node.options[property];
        const key = colorKeyFromValue(value);
        if (key) item[property] = this.palette[key];
      }
      // Zdog's cylinder does not propagate backface/frontFace changes itself.
      if (
        node.kind === "cylinder" &&
        item.frontBase !== undefined &&
        item.rearBase !== undefined
      ) {
        if (item.frontFace) item.frontBase.backface = item.frontFace;
        else if (item.backface) item.frontBase.backface = item.backface;
        else item.frontBase.backface = true;
        if (item.backface) item.rearBase.backface = item.backface;
        else item.rearBase.backface = true;
      }
    }
    this.dirty = true;
    this.onInvalidate();
  }

  pause(paused: boolean): void {
    this.paused = paused;
    for (const tween of [
      this.animationTween,
      this.mouthCycleTimeline,
      this.entryTween,
    ]) {
      if (paused) tween?.pause();
      else tween?.resume();
    }
  }

  tick(timestamp: number): boolean {
    if (this.destroyed) return false;
    if (!this.illustration.ctx) return false;
    const activeTween = this.hasActiveTween();
    const wantsRender = this.dirty || activeTween || this.mouseNeedsRender();
    if (wantsRender && timestamp - this.lastRenderTime >= 1000 / 24) {
      this.updateMouseTracking();
      this.illustration.updateRenderGraph();
      this.lastRenderTime = timestamp;
      this.dirty = false;
    }
    return this.dirty || this.hasActiveTween() || this.mouseNeedsRender();
  }

  renderStill(): void {
    if (this.destroyed || !this.dirty || !this.illustration.ctx) return;
    this.illustration.updateRenderGraph();
    this.dirty = false;
  }

  resize(): void {
    this.assertAlive();
    const cssWidth = readDimension(this.target, "width");
    const cssHeight = readDimension(this.target, "height");
    const [width, height] = boundedSize(
      cssWidth,
      cssHeight,
      this.maxPixels,
      positiveDevicePixelRatio(this.view?.devicePixelRatio),
    );
    this.illustration.zoom = framingZoom(width, height);
    this.illustration.setSize(width, height);
    this.preserveCanvasStyle(cssWidth, cssHeight);
    this.dirty = true;
    this.onInvalidate();
  }

  destroy(): void {
    if (this.destroyed)
      throw new Error("Sprite instance has already been destroyed");
    this.destroyed = true;
    this.stopAnimations();
    this.view?.removeEventListener("mousemove", this.mouseListener);
    this.resizeObserver.disconnect();
    const context = this.target.getContext("2d");
    if (context) context.clearRect(0, 0, this.target.width, this.target.height);
    this.restoreCanvasAttributes();
  }

  private createScene(
    node: SceneNode,
    parent: Zdog.SceneObject,
  ): Zdog.SceneObject {
    const options: Zdog.NodeOptions = { ...node.options };
    delete options.parent;
    delete options.name;
    delete options.x;
    delete options.y;
    delete options.z;
    options.addTo = parent;
    if (options.translate) options.translate = transform(options.translate);
    else if (
      node.options.x !== undefined ||
      node.options.y !== undefined ||
      node.options.z !== undefined
    ) {
      options.translate = transform({
        x: node.options.x,
        y: node.options.y,
        z: node.options.z,
      });
    }
    const colorKey = colorKeyFromValue(options.color);
    if (colorKey) options.color = this.palette[colorKey];
    const backfaceKey = colorKeyFromValue(options.backface);
    if (backfaceKey) options.backface = this.palette[backfaceKey];
    const frontFaceKey = colorKeyFromValue(options.frontFace);
    if (frontFaceKey) options.frontFace = this.palette[frontFaceKey];
    let item: Zdog.SceneObject;
    switch (node.kind) {
      case "group":
        item = new Zdog.Group(options);
        break;
      case "shape":
        options.path = options.path ?? [{}];
        item = new Zdog.Shape(options);
        break;
      case "ellipse":
        item = new Zdog.Ellipse(options);
        break;
      case "hemisphere":
        item = new Zdog.Hemisphere(options);
        break;
      case "cylinder":
        item = new Zdog.Cylinder(options);
        break;
    }
    this.items.set(node, item);
    for (const child of node.children) this.createScene(child, item);
    return item;
  }

  private indexVariants(): void {
    for (const [channel, values] of this.internals.variants.entries()) {
      const channelItems = new Map<string, Zdog.SceneObject>();
      for (const [variant, node] of values.entries()) {
        const item = this.items.get(node);
        if (item) channelItems.set(variant, item);
      }
      this.variantItems.set(channel, channelItems);
    }
  }

  private applyVariants(
    expression: ExpressionSpec | undefined,
    geometry: ActivitySpec["geometry"],
  ): void {
    for (const channelItems of this.variantItems.values()) {
      for (const item of channelItems.values()) item.visible = false;
    }
    const selected = { ...expression?.variants };
    for (const [channel, choices] of Object.entries(
      expression?.variantChoices ?? {},
    )) {
      const index = Math.min(
        choices.length - 1,
        Math.floor(Math.random() * choices.length),
      );
      const choice = choices[index];
      if (choice !== undefined) selected[channel] = choice;
    }
    if (geometry?.eyes) selected.eyes = geometry.eyes;
    if (geometry?.mouth) selected.mouth = geometry.mouth;
    if (geometry?.blush !== undefined)
      selected.blush = valueForBlush(geometry.blush);
    else if (expression?.blush !== undefined)
      selected.blush = valueForBlush(expression.blush);
    for (const [channel, variant] of Object.entries(selected)) {
      const item = this.variantItems.get(channel)?.get(variant);
      if (item) item.visible = true;
    }
  }

  private activitySpec(name: string): ActivitySpec {
    const defaults = STANDARD_ACTIVITY_DEFAULTS.get(name) ?? {
      geometry: {},
      mouseInfluence: 1,
    };
    const custom = this.internals.activities[name];
    if (!custom) return defaults;
    const motion = custom.motion ?? defaults.motion;
    const mouthCycle = custom.mouthCycle ?? defaults.mouthCycle;
    const activity = {
      ...defaults,
      ...custom,
      geometry: { ...defaults.geometry, ...custom.geometry },
    } satisfies Mutable<ActivitySpec>;
    if (motion !== undefined) activity.motion = motion;
    if (mouthCycle !== undefined) activity.mouthCycle = mouthCycle;
    return activity;
  }

  private startMotion(motion: MotionSpec, base: boolean): void {
    const targetNode = this.internals.nodesByName.get(motion.target);
    const target =
      targetNode === this.internals.root
        ? this.animationPivot
        : targetNode
          ? this.items.get(targetNode)
          : undefined;
    if (!target) return;
    const timeline = createTimeline({
      loop: motion.repeat === "loop" || motion.repeat === "yoyo",
      alternate: motion.repeat === "yoyo",
    });
    const duration = motion.durationMs ?? 1000;
    if (motion.translate)
      timeline.add(
        target.translate,
        { ...transform(motion.translate), duration, ease: "inOutSine" },
        0,
      );
    if (motion.rotate)
      timeline.add(
        target.rotate,
        { ...transform(motion.rotate), duration, ease: "inOutSine" },
        0,
      );
    if (base) this.animationTween = timeline;
    else this.entryTween = timeline;
  }

  private startMouthCycle(
    cycle: NonNullable<ActivitySpec["mouthCycle"]>,
    expression: ExpressionSpec | undefined,
  ): void {
    const steps: { until: number; mouth: string | undefined }[] = [];
    let duration = 0;
    for (const step of cycle) {
      finite(step.durationMs, "mouthCycle.durationMs");
      duration += step.durationMs;
      steps.push({
        until: duration,
        mouth: step.mouth === "open" ? "open" : expression?.variants?.mouth,
      });
    }
    let shown: string | undefined;
    this.mouthCycleTimeline = createTimer({
      duration,
      loop: true,
      onUpdate: (timer) => {
        const mouth = steps.find(
          (step) => timer.iterationCurrentTime < step.until,
        )?.mouth;
        if (mouth && mouth !== shown) {
          shown = mouth;
          this.showVariant("mouth", mouth);
        }
      },
      onLoop: () => {
        shown = undefined;
      },
    });
  }

  private showVariant(channel: string, variant: string): void {
    const channelItems = this.variantItems.get(channel);
    if (channelItems === undefined) return;
    const selected = channelItems.get(variant);
    if (selected === undefined) return;
    for (const item of channelItems.values()) item.visible = false;
    selected.visible = true;
    this.dirty = true;
  }

  private resetPivot(): void {
    Object.assign(this.animationPivot.rotate, { x: 0, y: 0, z: 0 });
    Object.assign(this.animationPivot.translate, { x: 0, y: 0, z: 0 });
    Object.assign(this.avatar.rotate, { x: -Zdog.TAU / 1.05, y: 0, z: 0 });
  }

  private stopAnimations(): void {
    this.animationTween?.cancel();
    this.mouthCycleTimeline?.cancel();
    this.entryTween?.cancel();
    this.animationTween = null;
    this.mouthCycleTimeline = null;
    this.entryTween = null;
  }

  private hasActiveTween(): boolean {
    return [this.animationTween, this.mouthCycleTimeline, this.entryTween].some(
      (tween) =>
        tween !== null && !tween.paused && !tween.completed && !tween.cancelled,
    );
  }

  private onMouseMove(event: MouseEvent): void {
    if (this.destroyed || this.paused) return;
    const rect = this.target.getBoundingClientRect();
    const width = rect.width || 1;
    const height = rect.height || 1;
    this.mouseX = Math.max(
      -1,
      Math.min(1, (event.clientX - rect.left - width / 2) / (width / 2)),
    );
    this.mouseY = Math.max(
      -1,
      Math.min(1, (event.clientY - rect.top - height / 2) / (height / 2)),
    );
    this.dirty = true;
    this.onInvalidate();
  }

  private updateMouseTracking(): void {
    const targetY = -this.mouseX * 0.4 * this.mouseInfluence;
    const targetX = -Zdog.TAU / 1.05 - this.mouseY * 0.2 * this.mouseInfluence;
    const dy = (targetY - this.avatar.rotate.y) * 0.08;
    const dx = (targetX - this.avatar.rotate.x) * 0.08;
    this.avatar.rotate.y += dy;
    this.avatar.rotate.x += dx;
    if (Math.abs(dy) > 0.001 || Math.abs(dx) > 0.001) this.dirty = true;
  }

  private mouseNeedsRender(): boolean {
    return (
      Math.abs(this.avatar.rotate.y + this.mouseX * 0.4 * this.mouseInfluence) >
        0.001 ||
      Math.abs(
        this.avatar.rotate.x +
          Zdog.TAU / 1.05 +
          this.mouseY * 0.2 * this.mouseInfluence,
      ) > 0.001
    );
  }

  private assertAlive(): void {
    if (this.destroyed) throw new Error("Sprite instance has been destroyed");
  }

  private restoreCanvasAttributes(): void {
    if (this.originalStyle === null) this.target.removeAttribute("style");
    else this.target.setAttribute("style", this.originalStyle);
    if (this.originalWidthAttribute === null)
      this.target.removeAttribute("width");
    else this.target.setAttribute("width", this.originalWidthAttribute);
    if (this.originalHeightAttribute === null)
      this.target.removeAttribute("height");
    else this.target.setAttribute("height", this.originalHeightAttribute);
  }

  private preserveCanvasStyle(width: number, height: number): void {
    if (this.originalStyle !== null)
      this.target.setAttribute("style", this.originalStyle);
    if (!this.originalHasInlineWidth)
      this.target.style.width = `${String(Math.round(width))}px`;
    if (!this.originalHasInlineHeight)
      this.target.style.height = `${String(Math.round(height))}px`;
  }
}

export const createZdogRenderer = (options: {
  readonly target: HTMLCanvasElement;
  readonly scene: ZdogDocument;
  readonly onInvalidate: () => void;
  readonly maxPixels: number;
  readonly palette?: Partial<Record<string, string>>;
}): SpriteRenderer => new ZdogSpriteRenderer(options);
