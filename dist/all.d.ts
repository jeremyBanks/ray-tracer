declare module "color" {
    /** An RGB number-channel color. */
    export const RGB: (r: number, g: number, b: number) => Color;
    export class Color {
        static BLACK: Color;
        static WHITE: Color;
        static MAGENTA: Color;
        static RED: Color;
        static YELLOW: Color;
        static GREEN: Color;
        static CYAN: Color;
        static BLUE: Color;
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
declare module "vector" {
    /** A vector in number^3 space. */
    export const V: (x: number, y: number, z: number) => Vector;
    export class Vector {
        static ZERO: Vector;
        static X: Vector;
        static Y: Vector;
        static Z: Vector;
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
declare module "raytracer" {
    import { Vector } from "vector";
    import { Color } from "color";
    export class RayTracer {
        canvas: HTMLCanvasElement;
        context: CanvasRenderingContext2D;
        image: ImageData;
        output: HTMLImageElement;
        constructor();
        width: number;
        height: number;
        focalPoint: Vector;
        sensorCenter: Vector;
        scene: Hittable[];
        render(): Promise<void>;
        getSensorColor(x: number, y: number): Color;
        maxBounces: number;
        getRayColor(ray: Ray, background?: Color): Color;
    }
    /** A ray proceeding from a point in a constant direction at one unit distance per one unit time. */
    export class Ray {
        origin: Vector;
        direction: Vector;
        previousHits: number;
        constructor(origin: Vector, direction: Vector, previousHits?: number);
        at(t: number): Vector;
    }
    /** An object our rays can hit. */
    export abstract class Hittable {
        material: Material;
        hit(ray: Ray): Hit | null;
        hits(ray: Ray): Hit[];
        allHits(ray: Ray): Hit[];
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
        subject: Hittable;
        t: number;
        normal: Vector;
        constructor(ray: Ray, subject: Hittable, t: number, location: Vector, normal: Vector);
    }
}
declare module "main" {
}
