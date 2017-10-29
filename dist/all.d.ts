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
declare module "geometry" {
    import { Vector } from "vector";
    /** A ray proceeding from a point in a constant direction at one unit distance per one unit time. */
    export class Ray {
        origin: Vector;
        direction: Vector;
        constructor(origin: Vector, direction: Vector);
        at(t: number): Vector;
    }
    /** The location and surface normal of a ray's hit. */
    export class Hit {
        readonly ray: Ray;
        readonly t: number;
        readonly location: Vector;
        readonly normal: Vector;
        constructor(ray: Ray, t: number, location: Vector, normal: Vector);
    }
    /** An object our rays can hit. */
    export abstract class Geometry {
        firstHit(ray: Ray): Hit | null;
        hits(ray: Ray): Hit[];
        allHits(ray: Ray): Hit[];
    }
    export class Sphere extends Geometry {
        center: Vector;
        radius: number;
        constructor(center: Vector, radius: number);
        allHits(ray: Ray): Hit[];
    }
}
declare module "camera" {
    import { Vector } from "vector";
    import { Ray } from "geometry";
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
declare module "util" {
    export const randomChoice: <T>(choices: T[]) => T;
}
declare module "settings" {
    export const samplesPerPixel = 4;
    export const maxSamplesPerBounce = 4;
    export const maxBounces = 32;
}
declare module "raytracer" {
    import { Color } from "color";
    import { Ray, Hit, Geometry } from "geometry";
    import { Camera } from "camera";
    export class RayTracer {
        readonly scene: Scene;
        constructor(scene: Scene);
        getRayColor(ray: Ray, previousHit?: RayHit): Color;
    }
    /** A material a Hittable can be made of, determining how it's rendered. */
    export class Material {
        readonly color: Color;
        constructor(color: Color);
        hitColor(tracer: RayTracer, rayHit: RayHit): Color;
    }
    /** All of the information about a hit and its ray. */
    export class RayHit {
        readonly subject: Item;
        readonly hit: Hit;
        readonly previousHit: RayHit | null;
        readonly previousHits: number;
        constructor(hit: Hit, subject: Item, previousHit?: RayHit);
    }
    export class Scene {
        items: Item[];
        camera: Camera;
        constructor();
    }
    export class Item {
        geometry: Geometry;
        material: Material;
        constructor(geometry: Geometry, material: Material);
        toString(): string;
    }
}
declare module "canvasrenderer" {
    import { RayTracer } from "raytracer";
    export class CanvasRenderer {
        readonly canvas: HTMLCanvasElement;
        readonly context: CanvasRenderingContext2D;
        readonly image: ImageData;
        readonly output: HTMLImageElement;
        readonly width: number;
        readonly height: number;
        constructor(width?: number, height?: number);
        render(rayTracer: RayTracer): Promise<void>;
    }
}
declare module "main" {
}
