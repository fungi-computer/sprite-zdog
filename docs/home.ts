import {
  check,
  defineSprite,
  toCharacter,
} from "@fungi.computer/sprite-zdog/author";

const dot = defineSprite({
  apiVersion: 1,
  name: "dot",
  palette: { body: "#4caf50" },
  build: ({ scene, color }) => ({
    root: scene.ellipse({ width: 20, height: 20, color: color("body") }),
  }),
  expressions: { normal: {} },
});

console.log(check(dot).nodeCount); // 1
console.log(toCharacter(dot).renderer); // "zdog"
