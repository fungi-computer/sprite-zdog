import {
  characterSchema,
  type CharacterDocument,
} from "@fungi.computer/sprite";
import type { SpriteDefinition } from "./author.js";
import { getDefinitionInternals, type InternalSceneNode } from "./internal.js";
import {
  zdogDocumentSchema,
  zdogNodeSchema,
  type ZdogDocument,
} from "./document.js";

/** Compile trusted scene-authoring code into a document that contains no code. */
export function toCharacter(definition: SpriteDefinition): CharacterDocument {
  const internals = getDefinitionInternals(definition);
  const ids = new Map<InternalSceneNode, string>();
  const nodes: ZdogDocument["nodes"] = [];
  const visit = (node: InternalSceneNode, parent?: string) => {
    const id = `node-${String(ids.size)}`;
    ids.set(node, id);
    const candidate =
      parent === undefined
        ? { id, kind: node.kind, options: node.options }
        : { id, parent, kind: node.kind, options: node.options };
    nodes.push(zdogNodeSchema.parse(candidate));
    for (const child of node.children) visit(child, id);
  };
  visit(internals.root);
  const variants = Object.fromEntries(
    [...internals.variants].map(([channel, values]) => [
      channel,
      Object.fromEntries(
        [...values].map(([name, node]) => {
          const id = ids.get(node);
          if (!id)
            throw new Error("Cannot export a variant outside the scene root");
          return [name, id];
        }),
      ),
    ]),
  );
  const data = zdogDocumentSchema.parse({
    root: ids.get(internals.root),
    nodes,
    variants,
    palette: internals.palette,
    expressions: internals.expressions,
    activities: internals.activities,
    defaultPresentation: {
      activity: internals.defaultActivity,
      expression: internals.defaultExpression,
    },
  });
  return characterSchema.parse(
    JSON.parse(
      JSON.stringify({
        version: 1,
        name: definition.name,
        renderer: "zdog",
        controls: Object.fromEntries(
          Object.entries(internals.palette).map(([name, value]) => [
            name,
            {
              type: "color",
              label: name,
              default:
                value.length === 4
                  ? `#${value
                      .slice(1)
                      .split("")
                      .map((digit) => digit + digit)
                      .join("")}`
                  : value,
            },
          ]),
        ),
        data,
      }),
    ),
  );
}
