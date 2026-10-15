import type {
  SceneBuilder,
  SceneNode,
  SpriteDefinitionInput,
} from "../author.js";
import { baseActivities, baseExpressions, buildBaseFace } from "./base-face.js";

const requiredNode = (
  nodes: Record<string, SceneNode>,
  name: string,
): SceneNode => {
  const node = nodes[name];
  if (!node) throw new Error(`Missing cat face node: ${name}`);
  return node;
};
type SceneNodeMap = Record<string, SceneNode>;
const sceneNodeMap = (nodes: SceneNodeMap): SceneNodeMap => nodes;

/**
 * The cat's authoring input, kept apart from its `defineSprite` call so
 * the avatar catalog can import it without building the scene at module
 * evaluation (a Worker cold-start cost). `./cat.js` is the definition.
 */
export const catInput = {
  apiVersion: 1,
  name: "cat",
  palette: {
    body: "#ffe6c6",
    eye: "#28282e",
    mouth: "#28282e",
    blush: "#feaae4",
    dead: "#6c5671",
    deadTongue: "#d9c8bf",
    tongue: "#f98284",
    stripes: "#dea38b",
    sweat: "#accce4",
    white: "#ffffff",
  },
  build({ scene, color }) {
    const root = scene.group({ name: "root" });
    const body = scene.group({ parent: root, name: "body", updateSort: true });
    scene.path({
      parent: body,
      name: "body.sphere",
      path: [{ x: 0, y: 0 }],
      color: color("body"),
      stroke: 32,
    });
    for (const side of [-1, 1]) {
      scene.path({
        parent: body,
        name: `ear.${side < 0 ? "left" : "right"}`,
        color: color("body"),
        fill: true,
        path: [
          { x: -6, y: 0 },
          { x: 6, y: 0 },
          { x: 0, y: -10 },
        ],
        rotate: { z: 0.6 * side },
        stroke: 3,
        translate: { x: 9 * side, y: -10 },
      });
    }

    const face = scene.group({
      parent: body,
      name: "face",
      translate: { z: 20 },
    });
    const base = buildBaseFace(scene, color, face, { hideMouth: true });
    const mouthGroup = scene.group({
      parent: face,
      name: "cat.mouth",
      translate: { y: 6, z: 2 },
    });
    type Path = NonNullable<Parameters<SceneBuilder["path"]>[0]["path"]>;
    const line = (name: string, path: Path, stroke: number): SceneNode =>
      scene.path({
        parent: mouthGroup,
        name: `cat.mouth.${name}`,
        closed: false,
        color: color("mouth"),
        path,
        stroke,
      });
    const mouths = sceneNodeMap({
      normal: line(
        "normal",
        [
          { x: -2, y: -1 },
          { x: 0, y: 0 },
          { x: 2, y: -1 },
        ],
        1.5,
      ),
      sad: line(
        "sad",
        [
          { x: -2.5, y: 2 },
          {
            bezier: [
              { x: 0, y: 0 },
              { x: 2.5, y: 2 },
              { x: 2.5, y: 2 },
            ],
          },
        ],
        1.5,
      ),
      angry: line(
        "angry",
        [
          { x: -3, y: 1 },
          { x: 3, y: 1 },
        ],
        2,
      ),
      small: line(
        "small",
        [
          { x: -1.5, y: 0 },
          { x: 1.5, y: 0 },
        ],
        1,
      ),
      worried: line(
        "worried",
        [
          { x: -2, y: 1 },
          {
            bezier: [
              { x: -0.5, y: 0.5 },
              { x: 0.5, y: 0.5 },
              { x: 2, y: 1 },
            ],
          },
        ],
        1,
      ),
    });
    const happy = scene.group({
      parent: mouthGroup,
      name: "cat.mouth.happy",
      translate: { y: 1 },
    });
    scene.path({
      parent: happy,
      closed: false,
      color: color("mouth"),
      path: [
        { x: -2.5, y: 1 },
        {
          bezier: [
            { x: 0, y: 3 },
            { x: 2.5, y: 1 },
            { x: 2.5, y: 1 },
          ],
        },
      ],
      stroke: 1.5,
    });
    scene.ellipse({
      parent: happy,
      width: 2,
      height: 1.5,
      stroke: 0,
      fill: true,
      color: color("tongue"),
      translate: { y: 2 },
    });
    mouths.happy = happy;
    mouths.surprised = scene.ellipse({
      parent: mouthGroup,
      name: "cat.mouth.surprised",
      width: 2.5,
      height: 3,
      stroke: 1.5,
      fill: true,
      color: color("mouth"),
      translate: { y: 1 },
    });
    const dead = scene.group({
      parent: mouthGroup,
      name: "cat.mouth.dead",
      translate: { y: 3 },
    });
    scene.ellipse({
      parent: dead,
      width: 2.5,
      height: 1.5,
      stroke: 1.5,
      fill: true,
      color: color("dead"),
    });
    scene.ellipse({
      parent: dead,
      width: 1.2,
      height: 0.8,
      stroke: 0,
      fill: true,
      color: color("deadTongue"),
      translate: { y: 0.5 },
    });
    mouths.dead = dead;
    mouths.pout = scene.ellipse({
      parent: mouthGroup,
      name: "cat.mouth.pout",
      width: 2,
      height: 2.5,
      stroke: 1.5,
      fill: true,
      color: color("mouth"),
      translate: { y: 1 },
    });
    mouths.open = scene.ellipse({
      parent: mouthGroup,
      name: "cat.mouth.open",
      width: 4,
      height: 5,
      stroke: 1.5,
      fill: true,
      color: color("mouth"),
      translate: { y: 1 },
    });

    const whiskers = scene.group({
      parent: face,
      name: "whiskers",
      translate: { y: 5, z: 2 },
    });
    for (const side of [-1, 1]) {
      const xOffset = side * 12;
      for (const [index, yOffset] of [-2, 0, 2].entries()) {
        scene.path({
          parent: whiskers,
          name: `whisker.${side < 0 ? "left" : "right"}.${String(index)}`,
          closed: false,
          color: color("eye"),
          path: [
            { x: 0, y: yOffset },
            { x: side * 8, y: yOffset + (index - 1) * 1.5 },
          ],
          stroke: 0.8,
          translate: { x: xOffset, y: yOffset * 0.5 },
        });
      }
    }

    const orderedMouths = {
      normal: requiredNode(mouths, "normal"),
      happy: mouths.happy,
      sad: requiredNode(mouths, "sad"),
      angry: requiredNode(mouths, "angry"),
      surprised: mouths.surprised,
      dead: mouths.dead,
      small: requiredNode(mouths, "small"),
      worried: requiredNode(mouths, "worried"),
      pout: mouths.pout,
      open: mouths.open,
    };
    return {
      root,
      variants: { eyes: base.eyes, mouth: orderedMouths, blush: base.blush },
    };
  },
  expressions: baseExpressions,
  activities: {
    ...baseActivities,
    listening: {
      motion: {
        target: "root",
        rotate: { x: -0.2 },
        durationMs: 300,
        repeat: "yoyo",
      },
      mouseInfluence: 0.3,
    },
    thinking: {
      motion: {
        target: "root",
        rotate: { z: 0.1 },
        durationMs: 800,
        repeat: "yoyo",
      },
      mouseInfluence: 0,
    },
  },
  defaultPresentation: { activity: "idle", expression: "normal" },
} satisfies SpriteDefinitionInput;
