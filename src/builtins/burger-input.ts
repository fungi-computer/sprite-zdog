import type {
  SceneBuilder,
  SceneNode,
  SpriteDefinitionInput,
} from "../author.js";
import { baseActivities, baseExpressions, buildBaseFace } from "./base-face.js";

type Path = NonNullable<Parameters<SceneBuilder["path"]>[0]["path"]>;
type PathMap = Record<string, Path>;
const pathMap = (paths: PathMap): PathMap => paths;
const requiredPath = (paths: PathMap, name: string): Path => {
  const path = paths[name];
  if (!path) throw new Error(`Missing burger path: ${name}`);
  return path;
};

/**
 * The burger's authoring input, kept apart from its `defineSprite` call so
 * the avatar catalog can import it without building the scene at module
 * evaluation (a Worker cold-start cost). `./burger.js` is the definition.
 */
export const burgerInput = {
  apiVersion: 1,
  name: "burger",
  palette: {
    bottomBun: "#e9c46a",
    bunSpot: "#d4a373",
    cheese: "#f4d03f",
    dead: "#636e72",
    deadTongue: "#b2bec3",
    eye: "#2d3436",
    lettuce: "#7cb342",
    mouth: "#2d3436",
    patty: "#5d4037",
    tomato: "#e74c3c",
    topBun: "#f4a261",
    blush: "#feaae4",
    tongue: "#f98284",
    sweat: "#accce4",
    white: "#ffffff",
  },
  build({ scene, color }) {
    const root = scene.group({ name: "root" });
    const body = scene.group({ parent: root, name: "body", updateSort: true });
    scene.cylinder({
      parent: body,
      name: "bottom-bun",
      backface: color("bottomBun"),
      color: color("bottomBun"),
      diameter: 34,
      frontFace: color("bunSpot"),
      length: 6,
      rotate: { x: Math.PI / 2 },
      stroke: false,
      translate: { y: 8 },
    });
    scene.cylinder({
      parent: body,
      name: "patty",
      color: color("patty"),
      diameter: 36,
      frontFace: color("patty"),
      length: 4,
      rotate: { x: Math.PI / 2 },
      stroke: false,
      translate: { y: 3 },
    });
    scene.cylinder({
      parent: body,
      name: "tomato",
      color: color("tomato"),
      diameter: 34,
      frontFace: color("tomato"),
      length: 2,
      rotate: { x: Math.PI / 2 },
      stroke: false,
      translate: { y: -2 },
    });
    const topBun = scene.hemisphere({
      parent: body,
      name: "top-bun",
      backface: color("bunSpot"),
      color: color("topBun"),
      diameter: 38,
      rotate: { x: Math.PI / 2 },
      stroke: false,
      translate: { y: -3 },
    });
    const seeds = [
      { x: -8, y: -6, z: 14 },
      { x: 6, y: -8, z: 13 },
      { x: 0, y: -10, z: 12 },
      { x: 10, y: -4, z: 13 },
      { x: -5, y: -2, z: 15 },
      { x: 4, y: -12, z: 11 },
    ];
    for (const [index, position] of seeds.entries())
      scene.path({
        parent: topBun,
        name: `seed.${String(index + 1)}`,
        path: [{ x: 0, y: 0 }],
        color: color("bunSpot"),
        stroke: 1.2,
        translate: position,
      });

    const face = scene.group({
      parent: body,
      name: "face",
      translate: { y: -5, z: 16 },
    });
    const base = buildBaseFace(scene, color, face, {
      blushMode: "medium-alias",
      hideMouth: true,
    });
    const mouthGroup = scene.group({
      parent: body,
      name: "burger.mouth",
      translate: { y: 1, z: 10 },
    });
    const cheesePaths = pathMap({
      angry: [
        { x: -13, y: 2 },
        { x: 13, y: 2 },
        { x: 13, y: 5 },
        {
          bezier: [
            { x: 7, y: 4 },
            { x: 0, y: 5 },
            { x: -7, y: 4 },
          ],
        },
        { x: -13, y: 5 },
      ],
      happy: [
        { x: -12, y: 0 },
        {
          bezier: [
            { x: -6, y: 3 },
            { x: 0, y: 5 },
            { x: 6, y: 3 },
          ],
        },
        { x: 12, y: 0 },
        { x: 13, y: 2 },
        {
          bezier: [
            { x: 7, y: 5 },
            { x: 0, y: 7 },
            { x: -7, y: 5 },
          ],
        },
        { x: -13, y: 2 },
      ],
      open: [
        { x: -10, y: 0 },
        {
          bezier: [
            { x: -10, y: 5 },
            { x: -5, y: 8 },
            { x: 0, y: 8 },
          ],
        },
        {
          bezier: [
            { x: 5, y: 8 },
            { x: 10, y: 5 },
            { x: 10, y: 0 },
          ],
        },
        { x: 10, y: 1 },
        {
          bezier: [
            { x: 5, y: 6 },
            { x: -5, y: 6 },
            { x: -10, y: 1 },
          ],
        },
      ],
      pout: [
        { x: -8, y: 2 },
        {
          bezier: [
            { x: 0, y: 5 },
            { x: 8, y: 2 },
            { x: 8, y: 4 },
          ],
        },
        { x: 0, y: 6 },
        { x: -8, y: 4 },
      ],
      sad: [
        { x: -12, y: 3 },
        {
          bezier: [
            { x: -6, y: 0 },
            { x: 0, y: -1 },
            { x: 6, y: 0 },
          ],
        },
        { x: 12, y: 3 },
        { x: 13, y: 5 },
        {
          bezier: [
            { x: 7, y: 2 },
            { x: 0, y: 1 },
            { x: -7, y: 2 },
          ],
        },
        { x: -13, y: 5 },
      ],
      small: [
        { x: -6, y: 1 },
        { x: 6, y: 1 },
        { x: 7, y: 3 },
        { x: 0, y: 2 },
        { x: -7, y: 3 },
      ],
      surprised: [],
      worried: [
        { x: -11, y: 1 },
        {
          bezier: [
            { x: -6, y: 3 },
            { x: -3, y: 1 },
            { x: 0, y: 2 },
          ],
        },
        {
          bezier: [
            { x: 3, y: 1 },
            { x: 6, y: 3 },
            { x: 11, y: 1 },
          ],
        },
        { x: 12, y: 3 },
        { x: 0, y: 4 },
        { x: -12, y: 3 },
      ],
      dead: [
        { x: -12, y: 1 },
        { x: 12, y: 1 },
        { x: 13, y: 4 },
        {
          bezier: [
            { x: 7, y: 3 },
            { x: 0, y: 4 },
            { x: -7, y: 3 },
          ],
        },
        { x: -13, y: 4 },
      ],
      normal: [
        { x: -12, y: 1 },
        { x: 12, y: 1 },
        { x: 13, y: 4 },
        {
          bezier: [
            { x: 7, y: 3 },
            { x: 0, y: 4 },
            { x: -7, y: 3 },
          ],
        },
        { x: -13, y: 4 },
      ],
    });
    const lettucePaths = pathMap({
      angry: [
        { x: -13, y: 0 },
        { x: 13, y: 0 },
        { x: 13, y: 2 },
        {
          bezier: [
            { x: 7, y: 1 },
            { x: 0, y: 2 },
            { x: -7, y: 1 },
          ],
        },
        { x: -13, y: 2 },
      ],
      happy: [
        { x: -12, y: 2 },
        {
          bezier: [
            { x: -6, y: 0 },
            { x: 0, y: -1 },
            { x: 6, y: 0 },
          ],
        },
        { x: 12, y: 2 },
        { x: 13, y: 3 },
        {
          bezier: [
            { x: 7, y: 1 },
            { x: 0, y: 0 },
            { x: -7, y: 1 },
          ],
        },
        { x: -13, y: 3 },
      ],
      open: [
        { x: -10, y: 2 },
        {
          bezier: [
            { x: -10, y: -3 },
            { x: -5, y: -6 },
            { x: 0, y: -6 },
          ],
        },
        {
          bezier: [
            { x: 5, y: -6 },
            { x: 10, y: -3 },
            { x: 10, y: 2 },
          ],
        },
        { x: 10, y: 1 },
        {
          bezier: [
            { x: 5, y: -4 },
            { x: -5, y: -4 },
            { x: -10, y: 1 },
          ],
        },
      ],
      pout: [
        { x: -8, y: 0 },
        {
          bezier: [
            { x: -4, y: -1 },
            { x: 0, y: 0 },
            { x: 4, y: -1 },
          ],
        },
        { x: 8, y: 0 },
        { x: 9, y: 1 },
        { x: 0, y: 1 },
        { x: -9, y: 1 },
      ],
      sad: [
        { x: -12, y: 0 },
        {
          bezier: [
            { x: -6, y: 2 },
            { x: 0, y: 3 },
            { x: 6, y: 2 },
          ],
        },
        { x: 12, y: 0 },
        { x: 13, y: 1 },
        {
          bezier: [
            { x: 7, y: 3 },
            { x: 0, y: 4 },
            { x: -7, y: 3 },
          ],
        },
        { x: -13, y: 1 },
      ],
      small: [
        { x: -6, y: 0 },
        {
          bezier: [
            { x: -3, y: 1 },
            { x: 0, y: 0 },
            { x: 3, y: 1 },
          ],
        },
        { x: 6, y: 0 },
        { x: 7, y: 1 },
        { x: 0, y: 1 },
        { x: -7, y: 1 },
      ],
      surprised: [
        { x: -13, y: 2 },
        {
          bezier: [
            { x: -7, y: -2 },
            { x: 0, y: -3 },
            { x: 7, y: -2 },
          ],
        },
        { x: 13, y: 2 },
        { x: 14, y: 3 },
        {
          bezier: [
            { x: 8, y: 0 },
            { x: 0, y: -1 },
            { x: -8, y: 0 },
          ],
        },
        { x: -14, y: 3 },
      ],
      worried: [
        { x: -11, y: 1 },
        {
          bezier: [
            { x: -6, y: 0 },
            { x: -3, y: 1 },
            { x: 0, y: 0 },
          ],
        },
        {
          bezier: [
            { x: 3, y: 2 },
            { x: 6, y: 0 },
            { x: 11, y: 1 },
          ],
        },
        { x: 12, y: 2 },
        {
          bezier: [
            { x: 7, y: 1 },
            { x: 0, y: 1 },
            { x: -7, y: 1 },
          ],
        },
        { x: -12, y: 2 },
      ],
      dead: [
        { x: -12, y: 1 },
        {
          bezier: [
            { x: -6, y: 0 },
            { x: 0, y: -0.5 },
            { x: 6, y: 0 },
          ],
        },
        { x: 12, y: 1 },
        { x: 13, y: 2 },
        {
          bezier: [
            { x: 7, y: 1 },
            { x: 0, y: 0.5 },
            { x: -7, y: 1 },
          ],
        },
        { x: -13, y: 2 },
      ],
      normal: [
        { x: -12, y: 1 },
        {
          bezier: [
            { x: -6, y: 0 },
            { x: 0, y: -0.5 },
            { x: 6, y: 0 },
          ],
        },
        { x: 12, y: 1 },
        { x: 13, y: 2 },
        {
          bezier: [
            { x: 7, y: 1 },
            { x: 0, y: 0.5 },
            { x: -7, y: 1 },
          ],
        },
        { x: -13, y: 2 },
      ],
    });
    const mouths: Record<string, SceneNode> = {};
    for (const name of [
      "normal",
      "happy",
      "sad",
      "angry",
      "surprised",
      "dead",
      "small",
      "worried",
      "pout",
      "open",
    ]) {
      const variant = scene.group({
        parent: mouthGroup,
        name: `burger.mouth.${name}`,
      });
      const cheeseTranslate = {
        y: name === "open" ? 2 : name === "small" ? 0.5 : 1.5,
        z: name === "pout" ? 1 : 0,
      };
      if (name === "surprised")
        scene.ellipse({
          parent: variant,
          name: `cheese.${name}`,
          color: color("cheese"),
          fill: true,
          height: 8,
          stroke: 2,
          translate: { y: 2, z: 0 },
          width: 6,
        });
      else
        scene.path({
          parent: variant,
          name: `cheese.${name}`,
          color: color("cheese"),
          fill: true,
          path: requiredPath(cheesePaths, name),
          stroke: 2,
          translate: cheeseTranslate,
        });
      const lettuceTranslate = {
        y: name === "open" ? 1 : name === "surprised" ? -1 : -0.5,
        z: name === "pout" ? 2 : 1,
      };
      scene.path({
        parent: variant,
        name: `lettuce.${name}`,
        color: color("lettuce"),
        fill: true,
        path: requiredPath(lettucePaths, name),
        stroke: 1.5,
        translate: lettuceTranslate,
      });
      mouths[name] = variant;
    }
    return {
      root,
      variants: { eyes: base.eyes, mouth: mouths, blush: base.blush },
    };
  },
  expressions: baseExpressions,
  activities: baseActivities,
  defaultPresentation: { activity: "idle", expression: "normal" },
} satisfies SpriteDefinitionInput;
