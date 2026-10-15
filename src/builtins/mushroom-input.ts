import type { SpriteDefinitionInput } from "../author.js";
import { baseActivities, baseExpressions, buildBaseFace } from "./base-face.js";

/**
 * The mushroom's authoring input, kept apart from its `defineSprite` call so
 * the avatar catalog can import it without building the scene at module
 * evaluation (a Worker cold-start cost). `./mushroom.js` is the definition.
 */
export const mushroomInput = {
  apiVersion: 1,
  name: "mushroom",
  palette: {
    body: "#fff7e4",
    cap: "#f98284",
    capSpot: "#ffe6c6",
    eye: "#28282e",
    mouth: "#28282e",
    blush: "#feaae4",
    dead: "#6c5671",
    deadTongue: "#d9c8bf",
    tongue: "#f98284",
    sweat: "#accce4",
    white: "#ffffff",
  },
  build({ scene, color }) {
    const root = scene.group({ name: "root" });
    const body = scene.group({ parent: root, name: "body", updateSort: true });
    scene.hemisphere({
      parent: body,
      name: "body.hemisphere",
      backface: color("cap"),
      color: color("body"),
      diameter: 32,
      rotate: { x: (3 * Math.PI) / 2 },
      stroke: false,
      translate: { y: 2 },
    });
    const cap = scene.hemisphere({
      parent: body,
      name: "cap.hemisphere",
      backface: color("capSpot"),
      color: color("cap"),
      diameter: 42,
      rotate: { x: Math.PI / 2 },
      stroke: false,
      translate: { y: 2 },
    });
    scene.path({
      parent: cap,
      name: "cap.spot.front",
      path: [{ x: 0, y: 0 }],
      color: color("capSpot"),
      stroke: 12,
      translate: { x: -8, y: 8, z: 12 },
    });
    scene.path({
      parent: cap,
      name: "cap.spot.top",
      path: [{ x: 0, y: 0 }],
      color: color("capSpot"),
      stroke: 18,
      translate: { x: 8, y: -4, z: 13 },
    });

    const face = scene.group({
      parent: body,
      name: "face",
      translate: { y: 7, z: 8 },
    });
    const variants = buildBaseFace(scene, color, face, {
      blushMode: "medium-alias",
    });
    return {
      root,
      variants: {
        eyes: variants.eyes,
        mouth: variants.mouth,
        blush: variants.blush,
      },
    };
  },
  expressions: baseExpressions,
  activities: {
    ...baseActivities,
    error: {
      geometry: { eyes: "dead", mouth: "dead" },
      motion: {
        target: "root",
        rotate: { x: 0.9 },
        durationMs: 600,
        repeat: "none",
      },
      mouseInfluence: 0.1,
    },
  },
  defaultPresentation: { activity: "idle", expression: "sleepy" },
} satisfies SpriteDefinitionInput;
