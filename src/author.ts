import {
  COLOR_PREFIX,
  asInternalNode,
  getDefinitionInternals,
  registerInternalNode,
  setDefinitionInternals,
  type InternalSceneNode,
} from "./internal.js";

const sceneNodeBrand: unique symbol = Symbol("Sprite.SceneNode");

/** An opaque node in a renderer-neutral Sprite scene. */
export type SceneNode = {
  /** Nominal marker that keeps renderer details out of the author surface. */
  readonly [sceneNodeBrand]: true;
};

/** A point in Sprite scene space. */
export type Point = {
  /** Horizontal scene coordinate. */
  readonly x: number;
  /** Vertical scene coordinate. */
  readonly y: number;
  /** Optional depth coordinate. */
  readonly z?: number;
};

/** One cubic Bezier path segment. */
export type BezierStep = {
  /** Two control points followed by the segment endpoint. */
  readonly bezier: readonly [Point, Point, Point];
};

/** One renderer-neutral shape path segment. */
export type PathStep = Point | BezierStep;

/** Optional translation, rotation, or scale coordinates. */
export type Transform = {
  /** Optional horizontal component. */
  readonly x?: number;
  /** Optional vertical component. */
  readonly y?: number;
  /** Optional depth component. */
  readonly z?: number;
};

/** Shared renderer-neutral options for one scene node. */
export type SceneNodeOptions = {
  /** Definition-local name used by authored references. */
  readonly name?: string;
  /** Parent node in the same definition. */
  readonly parent?: SceneNode;
  /** Horizontal translation that takes precedence over `translate.x`. */
  readonly x?: number;
  /** Vertical translation that takes precedence over `translate.y`. */
  readonly y?: number;
  /** Depth translation that takes precedence over `translate.z`. */
  readonly z?: number;
  /** Translation components not supplied by the direct coordinates. */
  readonly translate?: Transform;
  /** Rotation around each scene axis, in radians. */
  readonly rotate?: Transform;
  /** Scale applied along each scene axis. */
  readonly scale?: Transform;
  /** Whether the node participates in rendering. */
  readonly visible?: boolean;
  /** Literal paint or an opaque reference returned by `color`. */
  readonly color?: string;
  /** A false stroke keeps a solid primitive edge-free, as in Zdog fills. */
  readonly stroke?: number | false;
  readonly fill?: boolean;
  /** Optional rear/forward surface palette slots for 3D solids. */
  readonly backface?: string;
  /** Paint used for a primitive's front face when supported. */
  readonly frontFace?: string;
  /** Whether supported primitives update child depth ordering. */
  readonly updateSort?: boolean;
};

/** Renderer-neutral options for a freeform shape. */
export type PathOptions = {
  /** Ordered points and cubic Bezier segments in the path. */
  readonly path?: readonly PathStep[];
  /** Whether the renderer closes the path. */
  readonly closed?: boolean;
} & SceneNodeOptions;

/** Renderer-neutral options for an ellipse. */
export type EllipseOptions = {
  /** Horizontal diameter. */
  readonly width: number;
  /** Vertical diameter. */
  readonly height: number;
} & SceneNodeOptions;

/** Renderer-neutral options for a hemisphere. */
export type HemisphereOptions = {
  /** Diameter of the hemisphere's base. */
  readonly diameter: number;
} & SceneNodeOptions;

/** Renderer-neutral options for a cylinder. */
export type CylinderOptions = {
  /** Diameter of the cylinder's circular faces. */
  readonly diameter: number;
  /** Distance between the cylinder's faces. */
  readonly length: number;
} & SceneNodeOptions;

/** The complete renderer-neutral scene authoring surface. */
export type SceneBuilder = {
  /** Create a grouping node. */
  group(options?: SceneNodeOptions): SceneNode;
  /** Create a freeform path node. */
  path(options: PathOptions): SceneNode;
  /** Create an ellipse node. */
  ellipse(options: EllipseOptions): SceneNode;
  /** Create a hemisphere node. */
  hemisphere(options: HemisphereOptions): SceneNode;
  /** Create a cylinder node. */
  cylinder(options: CylinderOptions): SceneNode;
};

/** A named motion applied while presenting a Sprite. */
export type MotionSpec = {
  /** Name of the scene node targeted by the motion. */
  readonly target: string;
  /** Authored translation change. */
  readonly translate?: Transform;
  /** Authored rotation change. */
  readonly rotate?: Transform;
  /** Duration of one motion pass in milliseconds. */
  readonly durationMs?: number;
  /** Repetition mode for the motion. */
  readonly repeat?: "none" | "loop" | "yoyo";
};

/** The standard presentation activity names accepted by every Sprite. */
export type StandardActivity =
  "idle" | "listening" | "processing" | "speaking" | "thinking" | "error";

/** Variant selections applied to one expression or activity. */
export type StateGeometry = {
  /** Expression selected by an activity. */
  readonly expression?: string;
  /** Value selected from the `eyes` variant channel. */
  readonly eyes?: string;
  /** Value selected from the `mouth` variant channel. */
  readonly mouth?: string;
  /** Normalized blush intensity. */
  readonly blush?: number;
};

/** One timed mouth state in a speaking cycle. */
export type MouthCycleStep = {
  /** Time spent in this mouth state, in milliseconds. */
  readonly durationMs: number;
  /** Mouth state shown during the step. */
  readonly mouth: "base" | "open";
};

/** Presentation behavior associated with an activity. */
export type ActivitySpec = {
  /** Optional motion authored for the activity. */
  readonly motion?: MotionSpec;
  /** Optional geometry selections authored for the activity. */
  readonly geometry?: StateGeometry;
  /** Authored pointer-influence strength. */
  readonly mouseInfluence?: number;
  /** Ordered timed mouth states for the activity. */
  readonly mouthCycle?: readonly MouthCycleStep[];
};

/** Variant and motion behavior associated with an expression. */
export type ExpressionSpec = {
  /** Fixed value selected for each variant channel. */
  readonly variants?: Record<string, string>;
  /** Candidate values authored for each variant channel. */
  readonly variantChoices?: Record<string, readonly string[]>;
  /** Normalized blush intensity. */
  readonly blush?: number;
  /** Optional motion authored for the expression. */
  readonly motion?: MotionSpec;
};

/** The root and named variants produced by one author build. */
export type BuildResult = {
  /** Root node of the rendered scene tree. */
  readonly root: SceneNode;
  /** Definition-local nodes grouped by variant channel and value. */
  readonly variants?: Record<string, Record<string, SceneNode>>;
};

/** Renderer-neutral capabilities available while authoring a Sprite. */
export type AuthorContext = {
  /** Scene builder valid only for the duration of `build`. */
  readonly scene: SceneBuilder;
  /** Create an opaque reference to an own palette slot. */
  readonly color: (name: string) => string;
};

/** Input accepted by the Sprite authoring seam. */
export type SpriteDefinitionInput = {
  /** Version of the authoring contract used by this definition. */
  readonly apiVersion: 1;
  /** Human-readable Sprite definition name. */
  readonly name: string;
  /** Named default paints available to the author callback. */
  readonly palette: Record<string, string>;
  /** Construct the renderer-neutral scene and its named variants. */
  readonly build: (context: AuthorContext) => BuildResult;
  /** Named expression specifications; at least one is required. */
  readonly expressions: Record<string, ExpressionSpec>;
  /** Optional custom activity specifications. */
  readonly activities?: Record<string, ActivitySpec>;
  /** Initial activity and expression selected when mounted. */
  readonly defaultPresentation?: {
    /** Standard or custom activity selected initially. */
    readonly activity?: string;
    /** Declared expression selected initially. */
    readonly expression?: string;
  };
};

/** An authored Sprite definition preserving the author's input shape. */
export type SpriteDefinition<
  Input extends SpriteDefinitionInput = SpriteDefinitionInput,
> = Readonly<Input>;

/** A compact receipt describing one already-authored Sprite definition. */
export type SpriteCheckResult = {
  /** Whether the definition has completed author-time validation. */
  readonly valid: true;
  /** Human-readable name of the checked definition. */
  readonly name: string;
  /** Number of scene nodes reachable from the definition root. */
  readonly nodeCount: number;
  /** Expression names in author insertion order. */
  readonly expressions: readonly string[];
  /** Standard activities followed by unique custom activities in author order. */
  readonly activities: readonly string[];
  /** Variant values by channel, preserving author insertion order. */
  readonly variants: Readonly<Record<string, readonly string[]>>;
};

const finite = (value: number, label: string): void => {
  if (!Number.isFinite(value))
    throw new Error(`Sprite ${label} must be finite`);
};

const validateTransform = (
  value: Transform | undefined,
  label: string,
): void => {
  if (!value) return;
  for (const axis of ["x", "y", "z"] as const) {
    const coordinate = value[axis];
    if (coordinate !== undefined) finite(coordinate, `${label}.${axis}`);
  }
};

const validateMotion = (motion: MotionSpec, label: string): void => {
  if (!motion.target.trim())
    throw new Error(`Sprite ${label}.target cannot be empty`);
  validateTransform(motion.translate, `${label}.translate`);
  validateTransform(motion.rotate, `${label}.rotate`);
  if (motion.durationMs !== undefined) {
    finite(motion.durationMs, `${label}.durationMs`);
    if (motion.durationMs < 0)
      throw new Error(`Sprite ${label}.durationMs cannot be negative`);
  }
};

type SnapshotRecord = { [key: string]: SnapshotValue };
type SnapshotFunction = (...arguments_: never[]) => void;
type SnapshotValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | SnapshotFunction
  | readonly SnapshotValue[]
  | SnapshotRecord;

function isSnapshotArray(
  value: SnapshotValue,
): value is readonly SnapshotValue[] {
  return Array.isArray(value);
}

function cloneAndFreeze<T extends SnapshotValue>(
  value: T,
  seen?: WeakMap<object, SnapshotValue>,
): T;
function cloneAndFreeze(
  value: SnapshotValue,
  seen = new WeakMap<object, SnapshotValue>(),
): SnapshotValue {
  if (
    value === null ||
    !(value instanceof Object) ||
    value instanceof Function
  ) {
    return value;
  }
  const key: object = value;
  const prior = seen.get(key);
  if (prior !== undefined) return prior;
  if (isSnapshotArray(value)) {
    const copy = value.map((entry) => cloneAndFreeze(entry, seen));
    seen.set(key, copy);
    return Object.freeze(copy);
  }
  const copy: SnapshotRecord = {};
  seen.set(key, copy);
  for (const [property, entry] of Object.entries(value)) {
    copy[property] = cloneAndFreeze(entry, seen);
  }
  return Object.freeze(copy);
}

const freezeValue = (value: SnapshotValue, seen = new Set<object>()): void => {
  if (
    value === null ||
    value === undefined ||
    !isSnapshotObject(value) ||
    seen.has(value)
  )
    return;
  const key = value;
  seen.add(key);
  const entries: readonly SnapshotValue[] = Object.values(value);
  for (const entry of entries) {
    freezeValue(entry, seen);
  }
  Object.freeze(value);
};

const isSnapshotObject = (
  value: SnapshotValue,
): value is SnapshotRecord | readonly SnapshotValue[] =>
  Object(value) === value && !(value instanceof Function);

const freezeScene = (root: InternalSceneNode): void => {
  const visited = new Set<InternalSceneNode>();
  const visit = (node: InternalSceneNode): void => {
    if (visited.has(node)) return;
    visited.add(node);
    for (const child of node.children) visit(child);
    freezeValue(node.options);
    Object.freeze(node.children);
    Object.freeze(node);
  };
  visit(root);
};

const validatePath = (path: readonly PathStep[], label: string): void => {
  for (const [index, step] of path.entries()) {
    if ("bezier" in step) {
      for (const [controlIndex, point] of step.bezier.entries()) {
        finite(
          point.x,
          `${label}[${String(index)}].bezier[${String(controlIndex)}].x`,
        );
        finite(
          point.y,
          `${label}[${String(index)}].bezier[${String(controlIndex)}].y`,
        );
        if (point.z !== undefined)
          finite(
            point.z,
            `${label}[${String(index)}].bezier[${String(controlIndex)}].z`,
          );
      }
    } else {
      finite(step.x, `${label}[${String(index)}].x`);
      finite(step.y, `${label}[${String(index)}].y`);
      if (step.z !== undefined) finite(step.z, `${label}[${String(index)}].z`);
    }
  }
};

const valueForBlush = (value: number): string => {
  if (!value) return "off";
  if (value <= 0.5) return "small";
  if (value <= 0.8) return "medium";
  return "big";
};

const validateVariant = (
  variants: ReadonlyMap<string, ReadonlyMap<string, InternalSceneNode>>,
  channel: string,
  variant: string,
): void => {
  const channelVariants = variants.get(channel);
  if (!channelVariants)
    throw new Error(`Unknown Sprite variant channel: ${channel}`);
  if (!channelVariants.has(variant))
    throw new Error(`Unknown Sprite variant: ${channel}.${variant}`);
};

const validateGeometry = (
  geometry: StateGeometry | undefined,
  label: string,
  expressions: Record<string, ExpressionSpec>,
  variants: ReadonlyMap<string, ReadonlyMap<string, InternalSceneNode>>,
): void => {
  if (!geometry) return;
  if (
    geometry.expression !== undefined &&
    !(geometry.expression in expressions)
  ) {
    throw new Error(
      `Unknown Sprite ${label}.expression: ${geometry.expression}`,
    );
  }
  if (geometry.eyes !== undefined)
    validateVariant(variants, "eyes", geometry.eyes);
  if (geometry.mouth !== undefined)
    validateVariant(variants, "mouth", geometry.mouth);
  if (geometry.blush !== undefined) {
    finite(geometry.blush, `${label}.blush`);
    validateVariant(variants, "blush", valueForBlush(geometry.blush));
  }
};

/** The standard presentation activities every Sprite understands. */
export const STANDARD_ACTIVITIES = [
  "idle",
  "listening",
  "processing",
  "speaking",
  "thinking",
  "error",
] as const;
const standardActivityNames: ReadonlySet<string> = new Set(STANDARD_ACTIVITIES);

type BuiltScene = {
  readonly scene: SceneBuilder;
  readonly owner: symbol;
  readonly nodes: Map<string, InternalSceneNode>;
  readonly variants: Map<string, Map<string, InternalSceneNode>>;
};

const createScene = (): BuiltScene => {
  const owner = Symbol("sprite-scene");
  const nodes = new Map<string, InternalSceneNode>();
  const variants = new Map<string, Map<string, InternalSceneNode>>();

  const makeNode = (
    kind: InternalSceneNode["kind"],
    options: SceneNodeOptions = {},
  ): SceneNode => {
    const name = options.name;
    if (options.name !== undefined && (!name || name.trim() === "")) {
      throw new Error("Sprite node name cannot be empty");
    }
    if (name && nodes.has(name))
      throw new Error(`Duplicate Sprite node name: ${name}`);

    const { parent: parentOption, ...nodeOptions } = options;
    const parent = parentOption ? asInternalNode(parentOption) : undefined;
    if (parent && parent.owner !== owner)
      throw new Error("Sprite nodes cannot cross scene definitions");
    validateTransform(options.translate, "translate");
    validateTransform(options.rotate, "rotate");
    validateTransform(options.scale, "scale");
    if (options.stroke !== undefined && options.stroke !== false)
      finite(options.stroke, "stroke");

    const node: InternalSceneNode = {
      owner,
      kind,
      name,
      parent,
      children: [],
      options: {
        ...nodeOptions,
        translate:
          options.x !== undefined ||
          options.y !== undefined ||
          options.z !== undefined
            ? {
                ...options.translate,
                x: options.x ?? options.translate?.x,
                y: options.y ?? options.translate?.y,
                z: options.z ?? options.translate?.z,
              }
            : options.translate,
      },
    };
    if (parent) parent.children.push(node);
    if (name) nodes.set(name, node);
    const publicNode: SceneNode = { [sceneNodeBrand]: true };
    registerInternalNode(publicNode, node);
    return publicNode;
  };

  const scene: SceneBuilder = {
    group: (options = {}) => makeNode("group", options),
    path: (options) => {
      if (options.path) validatePath(options.path, "shape.path");
      return makeNode("shape", options);
    },
    ellipse: (options) => {
      finite(options.width, "ellipse.width");
      finite(options.height, "ellipse.height");
      return makeNode("ellipse", options);
    },
    hemisphere: (options) => {
      finite(options.diameter, "hemisphere.diameter");
      return makeNode("hemisphere", options);
    },
    cylinder: (options) => {
      finite(options.diameter, "cylinder.diameter");
      finite(options.length, "cylinder.length");
      return makeNode("cylinder", options);
    },
  };

  return { scene, owner, nodes, variants };
};

/** Validate and freeze one renderer-neutral Sprite definition. */
export function defineSprite<const Input extends SpriteDefinitionInput>(
  input: Input,
): SpriteDefinition<Input> {
  if (!Object.is(input.apiVersion, 1))
    throw new Error("Sprite definitions must declare apiVersion: 1");
  if (!input.name.trim())
    throw new Error("Sprite definition name cannot be empty");
  if (!Object.keys(input.palette).length)
    throw new Error("Sprite definitions need a palette");
  for (const [name, value] of Object.entries(input.palette)) {
    if (!name.trim() || !value.trim())
      throw new Error(`Invalid Sprite palette entry: ${name}`);
  }
  if (!Object.keys(input.expressions).length)
    throw new Error("Sprite definitions need an expression");

  const snapshot = cloneAndFreeze({
    ...input,
    palette: input.palette,
    expressions: input.expressions,
    activities: input.activities ?? {},
  }) satisfies Input & { readonly activities: Record<string, ActivitySpec> };
  const built = createScene();
  const color = (name: string): string => {
    if (!(name in snapshot.palette))
      throw new Error(`Unknown Sprite palette slot: ${name}`);
    return `${COLOR_PREFIX}${name}`;
  };
  const result = snapshot.build({ scene: built.scene, color });
  if (
    Object.is(result, null) ||
    Object.is(result, undefined) ||
    !Object.hasOwn(result, "root") ||
    Object.is(result.root, null) ||
    Object.is(result.root, undefined)
  )
    throw new Error("Sprite build must return a root node");
  const root = asInternalNode(result.root);
  if (root.owner !== built.owner)
    throw new Error("Sprite root belongs to another definition");

  for (const [channel, values] of Object.entries(result.variants ?? {})) {
    const channelVariants = new Map<string, InternalSceneNode>();
    for (const [variant, node] of Object.entries(values)) {
      const internal = asInternalNode(node);
      if (internal.owner !== built.owner)
        throw new Error(
          `Sprite variant is from another definition: ${channel}.${variant}`,
        );
      channelVariants.set(variant, internal);
    }
    built.variants.set(channel, channelVariants);
  }

  for (const [expressionName, expression] of Object.entries(
    snapshot.expressions,
  )) {
    for (const [channel, variant] of Object.entries(
      expression.variants ?? {},
    )) {
      const channelVariants = built.variants.get(channel);
      if (!channelVariants)
        throw new Error(`Unknown Sprite variant channel: ${channel}`);
      if (!channelVariants.has(variant)) {
        throw new Error(`Unknown Sprite variant: ${channel}.${variant}`);
      }
    }
    for (const [channel, choices] of Object.entries(
      expression.variantChoices ?? {},
    )) {
      const channelVariants = built.variants.get(channel);
      if (!channelVariants)
        throw new Error(`Unknown Sprite variant channel: ${channel}`);
      if (!choices.length)
        throw new Error(
          `Sprite expression choices cannot be empty: ${expressionName}.${channel}`,
        );
      for (const variant of choices) {
        if (!channelVariants.has(variant))
          throw new Error(`Unknown Sprite variant: ${channel}.${variant}`);
      }
    }
    if (!expressionName.trim())
      throw new Error("Sprite expression name cannot be empty");
  }

  const activities = snapshot.activities;
  for (const [activityName, activity] of Object.entries(activities)) {
    if (!activityName.trim())
      throw new Error("Sprite activity name cannot be empty");
    if (activity.motion) {
      validateMotion(activity.motion, `activity.${activityName}.motion`);
      if (!built.nodes.has(activity.motion.target)) {
        throw new Error(
          `Unknown Sprite activity target: ${activity.motion.target}`,
        );
      }
    }
    if (activity.mouseInfluence !== undefined)
      finite(
        activity.mouseInfluence,
        `activity.${activityName}.mouseInfluence`,
      );
    validateGeometry(
      activity.geometry,
      `activity.${activityName}.geometry`,
      snapshot.expressions,
      built.variants,
    );
    for (const [index, step] of (activity.mouthCycle ?? []).entries()) {
      finite(
        step.durationMs,
        `activity.${activityName}.mouthCycle[${String(index)}].durationMs`,
      );
      if (step.durationMs < 0)
        throw new Error(
          `Sprite activity.${activityName}.mouthCycle[${String(index)}].durationMs cannot be negative`,
        );
    }
  }

  for (const [expressionName, expression] of Object.entries(
    snapshot.expressions,
  )) {
    if (expression.blush !== undefined) {
      finite(expression.blush, `expression.${expressionName}.blush`);
      validateVariant(built.variants, "blush", valueForBlush(expression.blush));
    }
    if (expression.motion) {
      validateMotion(expression.motion, `expression.${expressionName}.motion`);
      if (!built.nodes.has(expression.motion.target))
        throw new Error(
          `Unknown Sprite expression target: ${expression.motion.target}`,
        );
    }
  }

  const firstExpression = Object.keys(snapshot.expressions)[0];
  const defaultExpression =
    snapshot.defaultPresentation?.expression ?? firstExpression;
  if (!defaultExpression || !(defaultExpression in snapshot.expressions)) {
    throw new Error(
      `Unknown Sprite default expression: ${String(defaultExpression)}`,
    );
  }
  const defaultActivity = snapshot.defaultPresentation?.activity ?? "idle";
  if (
    snapshot.defaultPresentation?.activity !== undefined &&
    !STANDARD_ACTIVITIES.some((activity) => activity === defaultActivity) &&
    !(defaultActivity in activities)
  ) {
    throw new Error(`Unknown Sprite default activity: ${defaultActivity}`);
  }

  for (const node of built.nodes.values()) freezeScene(node);
  const definition = snapshot;
  const variantNodes = new Set<InternalSceneNode>();
  for (const channel of built.variants.values()) {
    for (const node of channel.values()) variantNodes.add(node);
  }
  setDefinitionInternals(definition, {
    owner: built.owner,
    root,
    nodesByName: built.nodes,
    variants: built.variants,
    variantNodes,
    palette: snapshot.palette,
    activities,
    expressions: snapshot.expressions,
    defaultActivity,
    defaultExpression,
  });
  return definition;
}

/** Return a compact, machine-readable receipt for an already authored definition. */
export const check = (definition: SpriteDefinition): SpriteCheckResult => {
  const internals = getDefinitionInternals(definition);
  const visited = new Set<InternalSceneNode>();
  const visit = (node: InternalSceneNode): void => {
    if (visited.has(node)) return;
    visited.add(node);
    for (const child of node.children) visit(child);
  };
  visit(internals.root);
  const variants: Record<string, readonly string[]> = {};
  for (const [channel, values] of internals.variants)
    variants[channel] = [...values.keys()];
  return {
    valid: true,
    name: definition.name,
    nodeCount: visited.size,
    expressions: Object.keys(internals.expressions),
    activities: [
      ...STANDARD_ACTIVITIES,
      ...Object.keys(internals.activities).filter(
        (name) => !standardActivityNames.has(name),
      ),
    ],
    variants,
  };
};

export { toCharacter } from "./portable.js";
