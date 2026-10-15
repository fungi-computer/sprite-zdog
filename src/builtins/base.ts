import { defineSprite } from "../author.js";

const microMotion = (x: number, y: number) => ({
  target: "root",
  translate: { x, y },
  durationMs: 150,
  repeat: "none" as const,
});

const base = defineSprite({
  apiVersion: 1,
  name: "ball",
  palette: {
    body: "#accce4",
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
    // The body is a Zdog dot with stroke 32, the legacy base sphere.
    scene.path({
      parent: body,
      name: "body.sphere",
      path: [{ x: 0, y: 0 }],
      stroke: 32,
      color: color("body"),
    });
    const face = scene.group({
      parent: body,
      name: "face",
      translate: { z: 20 },
    });

    const ellipseEyes = (
      name: string,
      width: number,
      height: number,
      y: number,
      rotate: number,
      highlightWidth: number,
      highlightHeight: number,
    ) => {
      const group = scene.group({ parent: face, name: `eyes.${name}` });
      for (const side of [-1, 1]) {
        const eyeOptions = { parent: group, translate: { x: 6 * side, y } };
        if (rotate) Object.assign(eyeOptions, { rotate: { z: rotate * side } });
        const eye = scene.group(eyeOptions);
        scene.ellipse({
          parent: eye,
          width,
          height,
          stroke: 1.5,
          fill: true,
          color: color("eye"),
        });
        scene.ellipse({
          parent: eye,
          width: highlightWidth,
          height: highlightHeight,
          stroke: 0.5,
          fill: true,
          color: color("white"),
          translate: { y: -highlightHeight / 2, z: 1 },
        });
      }
      return group;
    };

    const normalEyes = ellipseEyes("normal", 3, 5, -2, 0, 1.5, 2);
    const sadEyes = ellipseEyes("sad", 3, 4, -1, -0.2, 1.5, 2);
    const surprisedEyes = ellipseEyes("surprised", 4, 5, -2, 0, 1.5, 2);

    const happyEyes = scene.group({ parent: face, name: "eyes.happy" });
    for (const side of [-1, 1]) {
      scene.path({
        parent: happyEyes,
        path: [
          { x: -2.5, y: 2 },
          {
            bezier: [
              { x: -1, y: -1.5 },
              { x: 1, y: -1.5 },
              { x: 2.5, y: 2 },
            ],
          },
        ],
        closed: false,
        stroke: 1.5,
        color: color("eye"),
        translate: { x: 6 * side, y: -2 },
      });
    }

    const angryEyes = scene.group({ parent: face, name: "eyes.angry" });
    for (const side of [-1, 1]) {
      const eye = scene.group({
        parent: angryEyes,
        rotate: { z: 0.3 * side },
        translate: { x: 6 * side, y: -1 },
      });
      scene.ellipse({
        parent: eye,
        width: 3,
        height: 4,
        stroke: 1.5,
        fill: true,
        color: color("eye"),
      });
      scene.path({
        parent: eye,
        path: [
          { x: -3, y: -3 },
          { x: 3, y: -2 },
        ],
        stroke: 1.5,
        color: color("eye"),
        translate: { y: -1 },
      });
    }

    const deadEyes = scene.group({ parent: face, name: "eyes.dead" });
    for (const side of [-1, 1]) {
      const eye = scene.group({
        parent: deadEyes,
        translate: { x: 6 * side, y: -2 },
      });
      for (const points of [
        [
          { x: -2, y: -3 },
          { x: 2, y: 3 },
        ],
        [
          { x: 2, y: -3 },
          { x: -2, y: 3 },
        ],
      ] as const) {
        scene.path({
          parent: eye,
          path: points,
          stroke: 1.5,
          color: color("dead"),
        });
      }
    }

    const confusedEyes = scene.group({ parent: face, name: "eyes.confused" });
    const confusedLeft = scene.group({
      parent: confusedEyes,
      translate: { x: -6, y: -2 },
    });
    scene.ellipse({
      parent: confusedLeft,
      width: 3,
      height: 5,
      stroke: 1.5,
      fill: true,
      color: color("eye"),
    });
    scene.path({
      parent: confusedLeft,
      path: [
        { x: -3, y: -4 },
        { x: 3, y: -2 },
      ],
      stroke: 1.5,
      color: color("eye"),
    });
    const confusedRight = scene.group({
      parent: confusedEyes,
      translate: { x: 6, y: -2 },
    });
    scene.ellipse({
      parent: confusedRight,
      width: 3,
      height: 5,
      stroke: 1.5,
      fill: true,
      color: color("eye"),
    });

    const sleepyEyes = scene.group({ parent: face, name: "eyes.sleepy" });
    for (const side of [-1, 1]) {
      scene.path({
        parent: sleepyEyes,
        path: [
          { x: -2.5, y: 1 },
          {
            bezier: [
              { x: -1, y: 0 },
              { x: 1, y: 0 },
              { x: 2.5, y: 1 },
            ],
          },
        ],
        closed: false,
        stroke: 1.5,
        color: color("eye"),
        translate: { x: 6 * side, y: -1 },
      });
    }

    const nervousEyes = scene.group({ parent: face, name: "eyes.nervous" });
    for (const side of [-1, 1]) {
      const eye = scene.group({
        parent: nervousEyes,
        translate: { x: 6 * side, y: -2 },
      });
      scene.ellipse({
        parent: eye,
        width: 3,
        height: 5,
        stroke: 1.5,
        fill: true,
        color: color("eye"),
      });
    }
    const sweat = scene.group({
      parent: nervousEyes,
      translate: { x: 10, y: 4 },
    });
    scene.path({
      parent: sweat,
      path: [{ x: 0, y: -4 }],
      stroke: 2,
      color: color("sweat"),
    });
    scene.ellipse({
      parent: sweat,
      width: 3,
      height: 4,
      stroke: 0,
      fill: true,
      color: color("sweat"),
      translate: { y: 2 },
    });

    const shyEyes = scene.group({ parent: face, name: "eyes.shy" });
    for (const side of [-1, 1]) {
      scene.ellipse({
        parent: shyEyes,
        width: 2.5,
        height: 2,
        stroke: 1.5,
        fill: true,
        color: color("eye"),
        translate: { x: 6 * side, y: -2 },
      });
    }

    const cuteEyes = scene.group({ parent: face, name: "eyes.cute" });
    for (const side of [-1, 1]) {
      const eye = scene.group({
        parent: cuteEyes,
        translate: { x: 6 * side, y: -1 },
      });
      scene.ellipse({
        parent: eye,
        width: 5,
        height: 6,
        stroke: 1.5,
        fill: true,
        color: color("eye"),
      });
      scene.ellipse({
        parent: eye,
        width: 2.5,
        height: 3,
        stroke: 0,
        fill: true,
        color: color("white"),
        translate: { y: -1.5, z: 1 },
      });
      scene.ellipse({
        parent: eye,
        width: 1,
        height: 1,
        stroke: 0,
        fill: true,
        color: color("white"),
        translate: { x: -1.5, y: 1.5, z: 1 },
      });
    }

    // A wink closes one eye and keeps the other open: each choice draws both.
    const winkEyes = scene.group({ parent: face, name: "eyes.wink" });
    const wink = (side: "left" | "right") => {
      const group = scene.group({
        parent: winkEyes,
        name: `eyes.wink.${side}`,
      });
      const closed = side === "left" ? -1 : 1;
      scene.path({
        parent: group,
        path: [
          { x: -2.5, y: 2 },
          {
            bezier: [
              { x: -1, y: -1.5 },
              { x: 1, y: -1.5 },
              { x: 2.5, y: 2 },
            ],
          },
        ],
        closed: false,
        stroke: 1.5,
        color: color("eye"),
        translate: { x: 6 * closed, y: -2 },
      });
      scene.ellipse({
        parent: group,
        width: 3,
        height: 5,
        stroke: 1.5,
        fill: true,
        color: color("eye"),
        translate: { x: -6 * closed, y: -2 },
      });
      return group;
    };
    const winkLeft = wink("left");
    const winkRight = wink("right");

    const mouth = (
      name: string,
      path: NonNullable<Parameters<typeof scene.path>[0]["path"]>,
      stroke = 1.5,
    ) =>
      scene.path({
        parent: face,
        name: `mouth.${name}`,
        path,
        closed: false,
        stroke,
        color: color("mouth"),
        translate: { y: 2 },
      });
    const normalMouth = mouth("normal", [
      { x: -2.5, y: 0 },
      { x: 2.5, y: 0 },
    ]);
    const happyMouth = mouth("happy", [
      { x: -2.5, y: 2 },
      {
        bezier: [
          { x: 0, y: 4 },
          { x: 2.5, y: 2 },
          { x: 2.5, y: 2 },
        ],
      },
    ]);
    const sadMouth = mouth("sad", [
      { x: -2.5, y: 2 },
      {
        bezier: [
          { x: 0, y: 0 },
          { x: 2.5, y: 2 },
          { x: 2.5, y: 2 },
        ],
      },
    ]);
    const smallMouth = mouth(
      "small",
      [
        { x: -1.5, y: 0 },
        { x: 1.5, y: 0 },
      ],
      1,
    );
    const worriedMouth = mouth(
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
    );
    const poutMouth = scene.ellipse({
      parent: face,
      name: "mouth.pout",
      width: 2,
      height: 2.5,
      stroke: 1.5,
      fill: true,
      color: color("mouth"),
      translate: { y: 3 },
    });
    const surprisedMouth = scene.ellipse({
      parent: face,
      name: "mouth.surprised",
      width: 3,
      height: 4,
      stroke: 1.5,
      fill: true,
      color: color("mouth"),
      translate: { y: 3 },
    });
    const deadMouth = scene.group({
      parent: face,
      name: "mouth.dead",
      translate: { y: 5 },
    });
    scene.ellipse({
      parent: deadMouth,
      width: 3,
      height: 2,
      stroke: 1.5,
      fill: true,
      color: color("dead"),
    });
    scene.ellipse({
      parent: deadMouth,
      width: 1.5,
      height: 1,
      stroke: 0,
      fill: true,
      color: color("deadTongue"),
      translate: { y: 0.5 },
    });
    const openMouth = scene.group({
      parent: face,
      name: "mouth.open",
      translate: { y: 2 },
    });
    scene.ellipse({
      parent: openMouth,
      width: 6,
      height: 4,
      stroke: 1.5,
      fill: true,
      color: color("mouth"),
    });
    scene.ellipse({
      parent: openMouth,
      name: "mouth.tongue",
      width: 3,
      height: 1.5,
      stroke: 0,
      fill: true,
      color: color("tongue"),
      translate: { y: 1 },
    });

    const blush = (
      name: string,
      width: number,
      height: number,
      stroke: number,
      x: number,
    ) => {
      const group = scene.group({ parent: face, name: `blush.${name}` });
      for (const side of [-1, 1])
        scene.ellipse({
          parent: group,
          width,
          height,
          stroke,
          fill: true,
          color: color("blush"),
          translate: { x: x * side, y: 4 },
        });
      return group;
    };
    const blushOff = scene.group({ parent: face, name: "blush.off" });
    const blushSmall = blush("small", 3.5, 1.8, 1, 9);
    const blushMedium = blush("medium", 5, 2.5, 1.5, 10);
    const blushBig = blush("big", 7, 3.5, 2, 11);

    return {
      root,
      variants: {
        eyes: {
          normal: normalEyes,
          happy: happyEyes,
          sad: sadEyes,
          angry: angryEyes,
          surprised: surprisedEyes,
          dead: deadEyes,
          confused: confusedEyes,
          sleepy: sleepyEyes,
          nervous: nervousEyes,
          shy: shyEyes,
          wink: winkLeft,
          cute: cuteEyes,
          "wink.left": winkLeft,
          "wink.right": winkRight,
        },
        mouth: {
          normal: normalMouth,
          happy: happyMouth,
          sad: sadMouth,
          angry: sadMouth,
          surprised: surprisedMouth,
          dead: deadMouth,
          small: smallMouth,
          worried: worriedMouth,
          pout: poutMouth,
          open: openMouth,
        },
        blush: {
          off: blushOff,
          small: blushSmall,
          medium: blushMedium,
          big: blushBig,
        },
      },
    };
  },
  expressions: {
    angry: {
      variants: { eyes: "angry", mouth: "angry", blush: "off" },
      motion: microMotion(1, 0),
    },
    confused: {
      variants: { eyes: "confused", mouth: "normal", blush: "off" },
      motion: microMotion(0, 0.5),
    },
    cute: {
      variants: { eyes: "cute", mouth: "happy", blush: "big" },
      motion: microMotion(0, -2.5),
    },
    dead: { variants: { eyes: "dead", mouth: "dead", blush: "off" } },
    happy: {
      variants: { eyes: "happy", mouth: "happy", blush: "medium" },
      motion: microMotion(0, -2),
    },
    nervous: {
      variants: { eyes: "nervous", mouth: "worried", blush: "off" },
      motion: microMotion(-0.5, -1),
    },
    normal: {
      variants: { eyes: "normal", mouth: "normal", blush: "off" },
      motion: microMotion(0, 1),
    },
    pleading: {
      variants: { eyes: "cute", mouth: "pout", blush: "medium" },
      motion: microMotion(0, -1),
    },
    sad: {
      variants: { eyes: "sad", mouth: "sad", blush: "off" },
      motion: microMotion(0, 2),
    },
    shy: {
      variants: { eyes: "shy", mouth: "small", blush: "small" },
      motion: microMotion(0, 1.5),
    },
    sleepy: {
      variants: { eyes: "sleepy", mouth: "small", blush: "off" },
      motion: microMotion(0, 2),
    },
    surprised: {
      variants: { eyes: "surprised", mouth: "surprised", blush: "off" },
      motion: microMotion(0, -3),
    },
    wink: {
      variants: { eyes: "wink", mouth: "happy", blush: "small" },
      variantChoices: { eyes: ["wink.left", "wink.right"] },
      motion: microMotion(0, -1.5),
    },
  },
  activities: {
    idle: {
      motion: {
        target: "root",
        translate: { y: 0.5 },
        durationMs: 2000,
        repeat: "yoyo",
      },
      mouseInfluence: 1,
    },
    listening: {
      motion: {
        target: "root",
        rotate: { x: -0.2 },
        durationMs: 300,
        repeat: "yoyo",
      },
      mouseInfluence: 0.3,
    },
    processing: { mouseInfluence: 0.2 },
    speaking: {
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
    thinking: {
      motion: {
        target: "root",
        rotate: { z: 0.1 },
        durationMs: 800,
        repeat: "yoyo",
      },
      mouseInfluence: 0,
    },
    error: { geometry: { expression: "dead" }, mouseInfluence: 0.1 },
  },
  defaultPresentation: { activity: "idle", expression: "normal" },
});

export default base;
