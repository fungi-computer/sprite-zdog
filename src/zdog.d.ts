declare module "zdog" {
  export const TAU: number;

  export type Vector = {
    x: number;
    y: number;
    z: number;
  };

  export type VectorOptions = {
    x?: number | undefined;
    y?: number | undefined;
    z?: number | undefined;
  };

  export type PathCommand =
    | VectorOptions
    | Readonly<{ bezier: readonly [PathCommand, PathCommand, PathCommand] }>
    | Readonly<Record<never, never>>;

  export type NodeOptions = {
    parent?: string | undefined;
    name?: string | undefined;
    x?: number | undefined;
    y?: number | undefined;
    z?: number | undefined;
    addTo?: SceneObject | undefined;
    translate?: VectorOptions | undefined;
    rotate?: VectorOptions | undefined;
    scale?: VectorOptions | undefined;
    visible?: boolean | undefined;
    color?: string | undefined;
    backface?: string | undefined;
    frontFace?: string | undefined;
    stroke?: number | false | undefined;
    fill?: boolean | undefined;
    updateSort?: boolean | undefined;
    path?: readonly PathCommand[] | undefined;
    closed?: boolean | undefined;
    width?: number | undefined;
    height?: number | undefined;
    diameter?: number | undefined;
    length?: number | undefined;
  };

  export class SceneObject {
    public readonly translate: Vector;
    public readonly rotate: Vector;
    public visible: boolean;
    public color: string | boolean | undefined;
    public backface: string | boolean | undefined;
    public frontFace: string | boolean | undefined;
    public readonly frontBase?: Ellipse | undefined;
    public readonly rearBase?: Ellipse | undefined;
    public addChild(child: SceneObject): void;
  }

  export class Group extends SceneObject {
    public constructor(options?: NodeOptions);
  }

  class ShapePrimitive extends SceneObject {
    public constructor(options?: NodeOptions);
  }

  export { ShapePrimitive as Shape };

  export class Ellipse extends ShapePrimitive {
    public constructor(options?: NodeOptions);
  }

  export class Hemisphere extends ShapePrimitive {
    public constructor(options?: NodeOptions);
  }

  export class Cylinder extends Group {
    public readonly frontBase: Ellipse;
    public readonly rearBase: Ellipse;
    public constructor(options?: NodeOptions);
  }

  export class Illustration extends Group {
    public readonly ctx: CanvasRenderingContext2D | null;
    public zoom: number;
    public constructor(options: {
      element: HTMLCanvasElement;
      resize?: boolean;
      zoom?: number;
    });
    public setSize(width: number, height: number): void;
    public updateRenderGraph(): void;
  }
}
