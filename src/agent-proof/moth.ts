import { defineSprite } from "@fungi.computer/sprite-zdog/author";

const moth = defineSprite({
  apiVersion: 1,
  name: "moth",
  palette: { body: "#eee6d3", ink: "#322f35", glow: "#f2b84b" },
  build({ scene, color }) {
    const root = scene.group({ name: "root" });
    const eyes = scene.group({ parent: root, name: "eyes" });
    scene.ellipse({
      parent: root,
      name: "body",
      width: 18,
      height: 26,
      color: color("body"),
      fill: true,
      stroke: false,
    });
    scene.ellipse({
      parent: eyes,
      name: "eye.left",
      width: 3,
      height: 5,
      x: -4,
      color: color("ink"),
      fill: true,
    });
    scene.ellipse({
      parent: eyes,
      name: "eye.right",
      width: 3,
      height: 5,
      x: 4,
      color: color("ink"),
      fill: true,
    });
    return { root, variants: { eyes: { normal: eyes } } };
  },
  expressions: {
    normal: { variants: { eyes: "normal" } },
    alert: { variants: { eyes: "normal" } },
  },
  activities: {
    idle: {},
    listening: {},
    processing: {},
    speaking: { mouthCycle: [{ durationMs: 20, mouth: "base" }] },
    thinking: {},
    error: {},
    flutter: { motion: { target: "root", durationMs: 20, repeat: "yoyo" } },
  },
});

export default moth;
