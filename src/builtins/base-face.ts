import type { SceneBuilder, SceneNode } from "../author.js";

export type BaseFaceVariants = Readonly<{
  eyes: Record<string, SceneNode>;
  mouth: Record<string, SceneNode>;
  blush: Record<string, SceneNode>;
}>;

/**
 * The shared face language used by the legacy ball, mushroom, cat and burger.
 * This is deliberately written against the public scene builder rather than
 * sharing renderer objects between definitions.
 */
export const buildBaseFace = (
  scene: SceneBuilder,
  color: (slot: string) => string,
  parent: SceneNode,
  options: {
    readonly blushMode?: "medium-alias" | "standard";
    readonly hideMouth?: boolean;
    readonly mouthTranslate?: { readonly y?: number; readonly z?: number };
  } = {},
): BaseFaceVariants => {
  const eyesParent = scene.group({ parent, name: "eyes" });
  const mouthOptions = { parent, name: "mouth" };
  if (options.mouthTranslate !== undefined)
    Object.assign(mouthOptions, { translate: options.mouthTranslate });
  const mouthParent = options.hideMouth ? undefined : scene.group(mouthOptions);

  const ellipseEyes = (
    name: string,
    width: number,
    height: number,
    y: number,
    rotate: number,
    highlightWidth: number,
    highlightHeight: number,
  ): SceneNode => {
    const group = scene.group({ parent: eyesParent, name: `eyes.${name}` });
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

  const neutralEyes = {
    normal: ellipseEyes("normal", 3, 5, -2, 0, 1.5, 2),
    sad: ellipseEyes("sad", 3, 4, -1, -0.2, 1.5, 2),
    surprised: ellipseEyes("surprised", 4, 5, -2, 0, 1.5, 2),
  };

  const happy = scene.group({ parent: eyesParent, name: "eyes.happy" });
  for (const side of [-1, 1]) {
    scene.path({
      parent: happy,
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

  const angry = scene.group({ parent: eyesParent, name: "eyes.angry" });
  for (const side of [-1, 1]) {
    const eye = scene.group({
      parent: angry,
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

  const dead = scene.group({ parent: eyesParent, name: "eyes.dead" });
  for (const side of [-1, 1]) {
    const eye = scene.group({
      parent: dead,
      translate: { x: 6 * side, y: -2 },
    });
    scene.path({
      parent: eye,
      path: [
        { x: -2, y: -3 },
        { x: 2, y: 3 },
      ],
      stroke: 1.5,
      color: color("dead"),
    });
    scene.path({
      parent: eye,
      path: [
        { x: 2, y: -3 },
        { x: -2, y: 3 },
      ],
      stroke: 1.5,
      color: color("dead"),
    });
  }

  const confused = scene.group({ parent: eyesParent, name: "eyes.confused" });
  const confusedLeft = scene.group({
    parent: confused,
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
    parent: confused,
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

  const sleepy = scene.group({ parent: eyesParent, name: "eyes.sleepy" });
  for (const side of [-1, 1]) {
    scene.path({
      parent: sleepy,
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

  const nervous = scene.group({ parent: eyesParent, name: "eyes.nervous" });
  for (const side of [-1, 1]) {
    const eye = scene.group({
      parent: nervous,
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
  const sweat = scene.group({ parent: nervous, translate: { x: 10, y: 4 } });
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

  const shy = scene.group({ parent: eyesParent, name: "eyes.shy" });
  for (const side of [-1, 1])
    scene.ellipse({
      parent: shy,
      width: 2.5,
      height: 2,
      stroke: 1.5,
      fill: true,
      color: color("eye"),
      translate: { x: 6 * side, y: -2 },
    });

  const cute = scene.group({ parent: eyesParent, name: "eyes.cute" });
  for (const side of [-1, 1]) {
    const eye = scene.group({
      parent: cute,
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
  const wink = scene.group({ parent: eyesParent, name: "eyes.wink" });
  const winkEyes = (side: "left" | "right"): SceneNode => {
    const group = scene.group({ parent: wink, name: `eyes.wink.${side}` });
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
  const winkLeft = winkEyes("left");
  const winkRight = winkEyes("right");

  const mouths = (() => {
    if (!mouthParent) return {};
    const mouth = (
      name: string,
      path: NonNullable<Parameters<SceneBuilder["path"]>[0]["path"]>,
      stroke = 1.5,
    ): SceneNode =>
      scene.path({
        parent: mouthParent,
        name: `mouth.${name}`,
        path,
        closed: false,
        stroke,
        color: color("mouth"),
        translate: { y: 2 },
      });
    const resting = {
      normal: mouth("normal", [
        { x: -2.5, y: 0 },
        { x: 2.5, y: 0 },
      ]),
      happy: mouth("happy", [
        { x: -2.5, y: 2 },
        {
          bezier: [
            { x: 0, y: 4 },
            { x: 2.5, y: 2 },
            { x: 2.5, y: 2 },
          ],
        },
      ]),
      sad: mouth("sad", [
        { x: -2.5, y: 2 },
        {
          bezier: [
            { x: 0, y: 0 },
            { x: 2.5, y: 2 },
            { x: 2.5, y: 2 },
          ],
        },
      ]),
      small: mouth(
        "small",
        [
          { x: -1.5, y: 0 },
          { x: 1.5, y: 0 },
        ],
        1,
      ),
      worried: mouth(
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
    };

    const pout = scene.ellipse({
      parent: mouthParent,
      name: "mouth.pout",
      width: 2,
      height: 2.5,
      stroke: 1.5,
      fill: true,
      color: color("mouth"),
      translate: { y: 3 },
    });
    const surprised = scene.ellipse({
      parent: mouthParent,
      name: "mouth.surprised",
      width: 3,
      height: 4,
      stroke: 1.5,
      fill: true,
      color: color("mouth"),
      translate: { y: 3 },
    });
    const deadMouth = scene.group({
      parent: mouthParent,
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
      parent: mouthParent,
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
    return {
      normal: resting.normal,
      happy: resting.happy,
      sad: resting.sad,
      angry: resting.sad,
      surprised,
      dead: deadMouth,
      small: resting.small,
      worried: resting.worried,
      pout,
      open: openMouth,
    };
  })();

  const blush = (
    name: string,
    width: number,
    height: number,
    stroke: number,
    x: number,
  ): SceneNode => {
    const group = scene.group({ parent, name: `blush.${name}` });
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
  const blushOff = scene.group({ parent, name: "blush.off" });
  // Mushroom and burger inherit one legacy medium blush node for all
  // intensities. Its stroke is part of their geometry contract.
  const blushMedium = blush("medium", 5, 2.5, 1, 10);
  const blushVariants =
    options.blushMode === "medium-alias"
      ? {
          off: blushOff,
          small: blushMedium,
          medium: blushMedium,
          big: blushMedium,
        }
      : {
          off: blushOff,
          small: blush("small", 3.5, 1.8, 1, 9),
          medium: blushMedium,
          big: blush("big", 7, 3.5, 2, 11),
        };

  const orderedEyes = {
    normal: neutralEyes.normal,
    happy,
    sad: neutralEyes.sad,
    angry,
    surprised: neutralEyes.surprised,
    dead,
    confused,
    sleepy,
    nervous,
    shy,
    wink: winkLeft,
    cute,
    "wink.left": winkLeft,
    "wink.right": winkRight,
  };
  return { eyes: orderedEyes, mouth: mouths, blush: blushVariants };
};

export const baseExpressions = {
  angry: {
    variants: { eyes: "angry", mouth: "angry", blush: "off" },
    motion: {
      target: "root",
      translate: { x: 1, y: 0 },
      durationMs: 150,
      repeat: "none" as const,
    },
  },
  confused: {
    variants: { eyes: "confused", mouth: "normal", blush: "off" },
    motion: {
      target: "root",
      translate: { x: 0, y: 0.5 },
      durationMs: 150,
      repeat: "none" as const,
    },
  },
  cute: {
    variants: { eyes: "cute", mouth: "happy", blush: "big" },
    motion: {
      target: "root",
      translate: { x: 0, y: -2.5 },
      durationMs: 150,
      repeat: "none" as const,
    },
  },
  dead: { variants: { eyes: "dead", mouth: "dead", blush: "off" } },
  happy: {
    variants: { eyes: "happy", mouth: "happy", blush: "medium" },
    motion: {
      target: "root",
      translate: { x: 0, y: -2 },
      durationMs: 150,
      repeat: "none" as const,
    },
  },
  nervous: {
    variants: { eyes: "nervous", mouth: "worried", blush: "off" },
    motion: {
      target: "root",
      translate: { x: -0.5, y: -1 },
      durationMs: 150,
      repeat: "none" as const,
    },
  },
  normal: {
    variants: { eyes: "normal", mouth: "normal", blush: "off" },
    motion: {
      target: "root",
      translate: { x: 0, y: 1 },
      durationMs: 150,
      repeat: "none" as const,
    },
  },
  pleading: {
    variants: { eyes: "cute", mouth: "pout", blush: "medium" },
    motion: {
      target: "root",
      translate: { x: 0, y: -1 },
      durationMs: 150,
      repeat: "none" as const,
    },
  },
  sad: {
    variants: { eyes: "sad", mouth: "sad", blush: "off" },
    motion: {
      target: "root",
      translate: { x: 0, y: 2 },
      durationMs: 150,
      repeat: "none" as const,
    },
  },
  shy: {
    variants: { eyes: "shy", mouth: "small", blush: "small" },
    motion: {
      target: "root",
      translate: { x: 0, y: 1.5 },
      durationMs: 150,
      repeat: "none" as const,
    },
  },
  sleepy: {
    variants: { eyes: "sleepy", mouth: "small", blush: "off" },
    motion: {
      target: "root",
      translate: { x: 0, y: 2 },
      durationMs: 150,
      repeat: "none" as const,
    },
  },
  surprised: {
    variants: { eyes: "surprised", mouth: "surprised", blush: "off" },
    motion: {
      target: "root",
      translate: { x: 0, y: -3 },
      durationMs: 150,
      repeat: "none" as const,
    },
  },
  wink: {
    variants: { mouth: "happy", blush: "small" },
    variantChoices: { eyes: ["wink.left", "wink.right"] },
    motion: {
      target: "root",
      translate: { x: 0, y: -1.5 },
      durationMs: 150,
      repeat: "none" as const,
    },
  },
} as const;

export const baseActivities = {
  idle: {
    motion: {
      target: "root",
      translate: { y: 0.5 },
      durationMs: 2000,
      repeat: "yoyo" as const,
    },
    mouseInfluence: 1,
  },
  listening: {
    motion: {
      target: "root",
      rotate: { x: -0.2 },
      durationMs: 300,
      repeat: "yoyo" as const,
    },
    mouseInfluence: 0.3,
  },
  processing: { mouseInfluence: 0.2 },
  speaking: {
    motion: {
      target: "root",
      translate: { y: 0.5 },
      durationMs: 1500,
      repeat: "yoyo" as const,
    },
    mouseInfluence: 0,
    mouthCycle: [
      { durationMs: 100, mouth: "open" as const },
      { durationMs: 150, mouth: "base" as const },
      { durationMs: 100, mouth: "open" as const },
      { durationMs: 200, mouth: "base" as const },
    ],
  },
  thinking: {
    motion: {
      target: "root",
      rotate: { z: 0.1 },
      durationMs: 800,
      repeat: "yoyo" as const,
    },
    mouseInfluence: 0,
  },
  error: { geometry: { expression: "dead" }, mouseInfluence: 0.1 },
} as const;
