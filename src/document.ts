import * as z from "zod";
import { colorKeyFromValue } from "./palette.js";

const transform = z.strictObject({
  x: z.number().optional(),
  y: z.number().optional(),
  z: z.number().optional(),
});
const point = z.strictObject({
  x: z.number(),
  y: z.number(),
  z: z.number().optional(),
});
const options = z.strictObject({
  name: z.string().min(1).optional(),
  x: z.number().optional(),
  y: z.number().optional(),
  z: z.number().optional(),
  translate: transform.optional(),
  rotate: transform.optional(),
  scale: transform.optional(),
  visible: z.boolean().optional(),
  color: z.string().optional(),
  stroke: z.union([z.number().nonnegative(), z.literal(false)]).optional(),
  fill: z.boolean().optional(),
  backface: z.string().optional(),
  frontFace: z.string().optional(),
  updateSort: z.boolean().optional(),
});
const identity = {
  id: z.string().min(1),
  parent: z.string().min(1).optional(),
};
export const zdogNodeSchema = z.discriminatedUnion("kind", [
  z.strictObject({ ...identity, kind: z.literal("group"), options }),
  z.strictObject({
    ...identity,
    kind: z.literal("shape"),
    options: options.extend({
      path: z
        .array(
          z.union([
            point,
            z.strictObject({ bezier: z.tuple([point, point, point]) }),
          ]),
        )
        .optional(),
      closed: z.boolean().optional(),
    }),
  }),
  z.strictObject({
    ...identity,
    kind: z.literal("ellipse"),
    options: options.extend({ width: z.number(), height: z.number() }),
  }),
  z.strictObject({
    ...identity,
    kind: z.literal("hemisphere"),
    options: options.extend({ diameter: z.number() }),
  }),
  z.strictObject({
    ...identity,
    kind: z.literal("cylinder"),
    options: options.extend({ diameter: z.number(), length: z.number() }),
  }),
]);
const motion = z.strictObject({
  target: z.string().min(1),
  translate: transform.optional(),
  rotate: transform.optional(),
  durationMs: z.number().nonnegative().optional(),
  repeat: z.enum(["none", "loop", "yoyo"]).optional(),
});
const expression = z.strictObject({
  variants: z.record(z.string(), z.string()).optional(),
  variantChoices: z.record(z.string(), z.array(z.string()).min(1)).optional(),
  blush: z.number().optional(),
  motion: motion.optional(),
});
const activity = z.strictObject({
  motion: motion.optional(),
  mouseInfluence: z.number().optional(),
  geometry: z
    .strictObject({
      expression: z.string().optional(),
      eyes: z.string().optional(),
      mouth: z.string().optional(),
      blush: z.number().optional(),
    })
    .optional(),
  mouthCycle: z
    .array(
      z.strictObject({
        durationMs: z.number().positive(),
        mouth: z.enum(["base", "open"]),
      }),
    )
    .min(1)
    .optional(),
});

/** Zdog's portable native data, not a new cross-renderer animation language. */
export const zdogDocumentSchema = z
  .strictObject({
    root: z.string().min(1),
    nodes: z.array(zdogNodeSchema).min(1),
    palette: z.record(z.string(), z.string()),
    variants: z.record(z.string(), z.record(z.string(), z.string())),
    expressions: z.record(z.string(), expression),
    activities: z.record(z.string(), activity),
    defaultPresentation: z.strictObject({
      activity: z.string(),
      expression: z.string(),
    }),
  })
  .superRefine((document, context) => {
    const visited = new Set<string>();
    const names = new Set<string>();
    const issue = (message: string) => {
      context.addIssue({ code: "custom", message });
    };
    for (const node of document.nodes) {
      if (
        visited.has(node.id) ||
        (node.parent !== undefined && !visited.has(node.parent)) ||
        (node.parent === undefined && node.id !== document.root)
      ) {
        issue("Scene needs unique, parent-first nodes and one root");
      }
      visited.add(node.id);
      if (node.options.name) {
        if (names.has(node.options.name))
          issue(`Duplicate Sprite node name: ${node.options.name}`);
        names.add(node.options.name);
      }
      for (const value of [
        node.options.color,
        node.options.backface,
        node.options.frontFace,
      ]) {
        const key = colorKeyFromValue(value);
        if (key !== undefined && !Object.hasOwn(document.palette, key))
          issue(`Unknown Sprite palette slot: ${key}`);
      }
    }
    if (!visited.has(document.root)) issue("Scene root is missing");
    for (const variants of Object.values(document.variants)) {
      for (const id of Object.values(variants)) {
        if (!visited.has(id)) issue("Variant node is missing");
      }
    }
    if (
      !Object.hasOwn(
        document.expressions,
        document.defaultPresentation.expression,
      )
    )
      issue(
        `Unknown Sprite default expression: ${document.defaultPresentation.expression}`,
      );
    const standard = [
      "idle",
      "listening",
      "processing",
      "speaking",
      "thinking",
      "error",
    ];
    if (
      !standard.includes(document.defaultPresentation.activity) &&
      !Object.hasOwn(document.activities, document.defaultPresentation.activity)
    )
      issue(
        `Unknown Sprite default activity: ${document.defaultPresentation.activity}`,
      );

    const variant = (channel: string, value: string) => {
      if (
        !Object.hasOwn(document.variants, channel) ||
        !Object.hasOwn(document.variants[channel] ?? {}, value)
      )
        issue(`Unknown Sprite variant: ${channel}.${value}`);
    };
    const motionTarget = (target: string) => {
      if (!names.has(target)) issue(`Unknown Sprite motion target: ${target}`);
    };
    const blush = (value: number) =>
      value === 0
        ? "off"
        : value <= 0.5
          ? "small"
          : value <= 0.8
            ? "medium"
            : "big";
    for (const [name, expression] of Object.entries(document.expressions)) {
      for (const [channel, value] of Object.entries(expression.variants ?? {}))
        variant(channel, value);
      for (const [channel, choices] of Object.entries(
        expression.variantChoices ?? {},
      ))
        for (const value of choices) variant(channel, value);
      if (expression.blush !== undefined)
        variant("blush", blush(expression.blush));
      if (expression.motion) motionTarget(expression.motion.target);
      if (!name.trim()) issue("Sprite expression name cannot be empty");
    }
    for (const [name, activity] of Object.entries(document.activities)) {
      if (activity.motion) motionTarget(activity.motion.target);
      const geometry = activity.geometry;
      if (
        geometry?.expression &&
        !Object.hasOwn(document.expressions, geometry.expression)
      )
        issue(
          `Unknown Sprite activity.${name}.geometry.expression: ${geometry.expression}`,
        );
      if (geometry?.eyes) variant("eyes", geometry.eyes);
      if (geometry?.mouth) variant("mouth", geometry.mouth);
      if (geometry?.blush !== undefined)
        variant("blush", blush(geometry.blush));
      if (!name.trim()) issue("Sprite activity name cannot be empty");
    }
  });

/** Validated portable native scene. */
export type ZdogDocument = z.infer<typeof zdogDocumentSchema>;
