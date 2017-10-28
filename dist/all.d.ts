declare module "vector" {
    /** A vector in number^3 space. */
    export const V: (x: number, y: number, z: number) => Vector;
    export class Vector {
        static ZERO: Readonly<Vector>;
        static X: Readonly<Vector>;
        static Y: Readonly<Vector>;
        static Z: Readonly<Vector>;
        readonly x: number;
        readonly y: number;
        readonly z: number;
        constructor(x: number, y: number, z: number);
        private magnitudeValue?;
        magnitude(): number;
        private directionValue?;
        direction(): Vector;
        negative(): Vector;
        add(other: Vector): Vector;
        sub(other: Vector): Vector;
        scale(factor: number): Vector;
        dot(other: Vector): number;
        cross(other: Vector): Vector;
        static randomUnit(): Vector;
    }
}
declare module "ray" {
    import { Vector } from "vector";
    /** A ray proceeding from a point in a constant direction at one unit distance per one unit time. */
    export class Ray {
        origin: Vector;
        direction: Vector;
        previousHits: number;
        constructor(origin: Vector, direction: Vector, previousHits?: number);
        at(t: number): Vector;
    }
}
declare module "camera" {
    import { Vector } from "vector";
    import { Ray } from "ray";
    export class Camera {
        readonly location: Vector;
        readonly direction: Vector;
        readonly depth: number;
        readonly focalPoint: Vector;
        readonly width: number;
        readonly height: number;
        protected readonly halfWidth: number;
        protected readonly halfHeight: number;
        moveTo(location: Vector): Camera;
        lookAt(location: Vector): Camera;
        setFov(degrees: number): Camera;
        getRay(x: number, y: number): Ray;
    }
}
declare module "color" {
    /** An RGB number-channel color. */
    export const RGB: (r: number, g: number, b: number) => Color;
    export class Color {
        static BLACK: Readonly<Color>;
        static BLUE: Readonly<Color>;
        static GREEN: Readonly<Color>;
        static CYAN: Readonly<Color>;
        static RED: Readonly<Color>;
        static MAGENTA: Readonly<Color>;
        static YELLOW: Readonly<Color>;
        static WHITE: Readonly<Color>;
        readonly r: number;
        readonly g: number;
        readonly b: number;
        constructor(r: number, g: number, b: number);
        readonly r8: number;
        readonly g8: number;
        readonly b8: number;
        pow(exponent: number): Color;
        static blend(colors: (Color | [number, Color])[]): Color;
    }
}
declare module "raytracer" {
    import { Color } from "color";
    import { Vector } from "vector";
    import { Ray } from "ray";
    import { Camera } from "camera";
    export class RayTracer {
        canvas: HTMLCanvasElement;
        context: CanvasRenderingContext2D;
        image: ImageData;
        output: HTMLImageElement;
        width: number;
        height: number;
        scene: Scene;
        constructor();
        render(): Promise<void>;
        getSensorColor(x: number, y: number): Color;
        maxBounces: number;
        getRayColor(ray: Ray, background?: Color): Color;
    }
    /** A material a Hittable can be made of, determining how it's rendered. */
    export class Material {
        color: Color;
        constructor(color: Color);
        colorHit(tracer: RayTracer, hit: Hit): Color;
    }
    /** Information about a particular hit of a Ray into a Hittable. */
    export class Hit {
        location: Vector;
        ray: Ray;
        subject: Item;
        t: number;
        normal: Vector;
        constructor(ray: Ray, subject: Item, t: number, location: Vector, normal: Vector);
    }
    export class Scene {
        items: Item[];
        camera: Camera;
    }
    export class Item {
        geometry: Geometry;
        material: Material;
        constructor(geometry: Geometry, material: Material);
    }
    /** An object our rays can hit. */
    export abstract class Geometry {
        hit(ray: Ray): Hit | null;
        hits(ray: Ray): Hit[];
        allHits(ray: Ray): Hit[];
    }
}
declare module "main" {
}
