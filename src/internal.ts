import type {
  ActivitySpec,
  ExpressionSpec,
  PathStep,
  SceneNode,
  SceneNodeOptions,
  SpriteDefinition,
} from "./author.js";
export { COLOR_PREFIX } from "./palette.js";

export type InternalNodeKind =
  "group" | "shape" | "ellipse" | "hemisphere" | "cylinder";

export type InternalTransform = {
  readonly x?: number | undefined;
  readonly y?: number | undefined;
  readonly z?: number | undefined;
};

export type InternalSceneOptions = Omit<SceneNodeOptions, "translate"> & {
  readonly translate?: InternalTransform | undefined;
  readonly path?: readonly PathStep[] | undefined;
  readonly closed?: boolean | undefined;
  readonly width?: number | undefined;
  readonly height?: number | undefined;
  readonly diameter?: number | undefined;
  readonly length?: number | undefined;
};

export type InternalSceneNode = {
  readonly owner: symbol;
  readonly kind: InternalNodeKind;
  readonly name: string | undefined;
  readonly parent: InternalSceneNode | undefined;
  readonly children: InternalSceneNode[];
  readonly options: InternalSceneOptions;
};

export type InternalDefinition = {
  readonly owner: symbol;
  readonly root: InternalSceneNode;
  readonly nodesByName: ReadonlyMap<string, InternalSceneNode>;
  readonly variants: ReadonlyMap<
    string,
    ReadonlyMap<string, InternalSceneNode>
  >;
  readonly variantNodes: ReadonlySet<InternalSceneNode>;
  readonly palette: Record<string, string>;
  readonly activities: Record<string, ActivitySpec>;
  readonly expressions: Record<string, ExpressionSpec>;
  readonly defaultActivity: string;
  readonly defaultExpression: string;
};

const definitions = new WeakMap<object, InternalDefinition>();
const publicNodes = new WeakMap<SceneNode, InternalSceneNode>();

export const registerInternalNode = (
  publicNode: SceneNode,
  internalNode: InternalSceneNode,
): void => {
  publicNodes.set(publicNode, internalNode);
};

export const setDefinitionInternals = (
  definition: SpriteDefinition,
  internals: InternalDefinition,
): void => {
  definitions.set(definition, internals);
};

export const getDefinitionInternals = (
  definition: SpriteDefinition,
): InternalDefinition => {
  const internals = definitions.get(definition);
  if (!internals) throw new Error("Invalid Sprite definition");
  return internals;
};

export const asInternalNode = (node: SceneNode): InternalSceneNode => {
  const internal = publicNodes.get(node);
  if (internal === undefined) throw new Error("Invalid Sprite scene node");
  return internal;
};
