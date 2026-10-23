import type { Renderer } from "@fungi.computer/sprite";
import * as Effect from "effect/Effect";
import * as z from "zod";
import { zdogDocumentSchema } from "./document.js";
import { createZdogRenderer } from "./zdog-runtime.js";

/** Optional native Zdog adapter. Scene data is decoded before creating the canvas. */
const renderZdog: Renderer = (context) =>
  Effect.gen(function* () {
    const scene = zdogDocumentSchema.parse(context.document.data);
    const canvas = yield* Effect.acquireRelease(
      Effect.sync(() => context.target.ownerDocument.createElement("canvas")),
      (canvas) =>
        Effect.sync(() => {
          canvas.remove();
        }),
    );
    canvas.style.cssText = "width:100%;height:100%;display:block";
    context.target.replaceChildren(canvas);
    const view = context.target.ownerDocument.defaultView;
    if (!view) throw new Error("Zdog avatar requires a browser window");
    let frame: number | undefined;
    let paused = true;
    let destroyed = false;
    const schedule = () => {
      if (paused || destroyed || frame !== undefined) return;
      frame = view.requestAnimationFrame((time) => {
        frame = undefined;
        if (native.tick(time)) schedule();
      });
    };
    // A paused player (reduced motion, hidden page, host pause) runs no frame
    // loop, so every change it must show, including the canvas clear that a
    // resize causes, is drawn at once as one still frame.
    const invalidate = () => {
      if (destroyed) return;
      if (paused) native.renderStill();
      else schedule();
    };
    const native = yield* Effect.acquireRelease(
      Effect.sync(() =>
        createZdogRenderer({
          target: canvas,
          scene,
          onInvalidate: invalidate,
          maxPixels: context.maxPixels,
        }),
      ),
      (native) =>
        Effect.sync(() => {
          native.destroy();
        }),
    );
    yield* Effect.addFinalizer(() =>
      Effect.sync(() => {
        destroyed = true;
        if (frame !== undefined) view.cancelAnimationFrame(frame);
      }),
    );
    native.pause(true);
    let controlled = false;
    let presentationKey: string | undefined;
    let paletteKey: string | undefined;
    return {
      activities: [
        "idle",
        "listening",
        "processing",
        "speaking",
        "thinking",
        "error",
        ...Object.keys(scene.activities),
      ],
      expressions: [
        scene.defaultPresentation.expression,
        ...Object.keys(scene.expressions),
      ].filter((value, index, values) => values.indexOf(value) === index),
      set(presentation) {
        const palette: Record<string, string> = {};
        for (const [key, value] of Object.entries(presentation.appearance)) {
          const color = z.string().safeParse(value);
          if (!color.success)
            throw new Error(`Zdog palette value must be a color: ${key}`);
          palette[key] = color.data;
        }
        const nextPalette = JSON.stringify(palette);
        if (nextPalette !== paletteKey) {
          native.setPalette(palette);
          paletteKey = nextPalette;
        }
        const expression =
          presentation.expression ?? scene.defaultPresentation.expression;
        if (!expression) throw new Error("Zdog avatar needs an expression");
        const nextPresentation = JSON.stringify([
          presentation.activity,
          expression,
        ]);
        if (nextPresentation !== presentationKey) {
          native.present({ activity: presentation.activity, expression });
          presentationKey = nextPresentation;
        }
        controlled = presentation.timeMs !== undefined;
        if (presentation.timeMs !== undefined) native.seek(presentation.timeMs);
        invalidate();
      },
      pause(value) {
        paused = controlled || value;
        native.pause(paused);
        if (paused && frame !== undefined) {
          view.cancelAnimationFrame(frame);
          frame = undefined;
        }
        invalidate();
      },
    };
  });

export default renderZdog;
