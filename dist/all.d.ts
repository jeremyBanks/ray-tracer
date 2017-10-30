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
        readonly position: Vector;
        readonly radius: number;
        constructor(position: Vector, radius?: number);
        firstHit(ray: Ray): Hit | null;
        protected allHits(ray: Ray): Hit[];
    }
    export class Sphere extends Geometry {
        protected allHits(ray: Ray): Hit[];
    }
    export class Plane extends Geometry {
        readonly normal: Vector;
        constructor(origin: Vector, normal: Vector);
        protected allHits(ray: Ray): Hit[];
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
    export const RGB: (r: number, g?: number, b?: number) => Color;
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
        static blend(...colors: (Color | [number, Color])[]): Color;
        static multiply(...colors: Color[]): Color;
        static screen(...colors: Color[]): Color;
    }
}
declare module "util" {
    export const randomChoice: <T>(choices: T[]) => T;
}
declare module "material" {
    import { Hit } from "geometry";
    import { Vector } from "vector";
    import { Color } from "color";
    /** A material a Hittable can be made of, determining how it's rendered. */
    export class Material {
        readonly color: Color;
        readonly colorStrength: number;
        readonly colorMode: 'absorb' | 'emit';
        readonly fuzziness: number;
        constructor(color?: Color, colorStrength?: number, fuzziness?: number);
        /**
         * generate a possible angle of reflection.
         * this can produce randomized results; it will be called multiple times.
         * if possible the random element should be scaled by fuzziness, down to
         * a non-random behaviour at 0.0.
         */
        getDeflection(hit: Hit): Vector;
        protected fuzzDirection(direction: Vector): Vector;
    }
    /** A material that scatters rays, ignoring their incoming angle. */
    export class MatteMaterial extends Material {
        static PURE_FUZZ: MatteMaterial;
        static PURE_PROJECTION: MatteMaterial;
        getDeflection(hit: Hit): Vector;
    }
    /** A material that reflects rays. */
    export class ShinyMaterial extends Material {
        static PURE_FUZZ: MatteMaterial;
        static PURE_REFLECTION: MatteMaterial;
        readonly fuzz: number;
        getDeflection(hit: Hit): Vector;
    }
    /** A material that refracts rays. */
    export class GlassMaterial extends Material {
        color: Readonly<Color>;
    }
    /** A light that emits light and also lets rays pass through */
    export class Light extends Material {
        readonly colorMode: string;
        constructor(color: Color);
    }
}
declare module "voxel" {
    import { Vector } from "vector";
    import { Geometry, Ray, Hit } from "geometry";
    export abstract class VoxelGeometry extends Geometry {
    }
    export class MaskedGeometry extends VoxelGeometry {
        readonly voxelDistance: number;
        readonly voxelRadius: number;
        readonly front: (number | undefined)[][];
        readonly top: (number[] | undefined[])[];
        readonly side: (number | undefined)[][];
        readonly pixelSize: number;
        readonly pixelWidth: number;
        readonly pixelHeight: number;
        readonly pixelDepth: number;
        readonly size: number;
        readonly radius: number;
        readonly voxelGeometries: Geometry[];
        constructor(position: Vector);
        protected allHits(ray: Ray): Hit[];
    }
}
declare module "scene" {
    import { Camera } from "camera";
    import { Material } from "material";
    import { Geometry } from "geometry";
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
declare module "raytracer" {
    import { Color } from "color";
    import { Scene, Item } from "scene";
    import { Ray, Hit } from "geometry";
    export class RayTracer {
        readonly scene: Scene;
        readonly maxSamplesPerBounce: number;
        readonly maxBounces: number;
        readonly skyColor: Color;
        constructor(scene: Scene);
        getRayColor(ray: Ray, previousHit?: TracedHit): Color;
    }
    /** All of the information about a hit and its ray. */
    export class TracedHit {
        readonly subject: Item;
        readonly hit: Hit;
        readonly previous: TracedHit | null;
        readonly previousCount: number;
        constructor(hit: Hit, subject: Item, previousHit?: TracedHit);
    }
}
declare module "canvasrenderer" {
    import { RayTracer } from "raytracer";
    export class CanvasRenderer {
        readonly canvas: HTMLCanvasElement;
        readonly context: CanvasRenderingContext2D;
        readonly image: ImageData;
        readonly output: HTMLImageElement;
        readonly samplesPerPixel: number;
        readonly intraSampleDelay: number;
        readonly width: number;
        readonly height: number;
        readonly gammaPower: number;
        constructor(width?: number, height?: number);
        render(rayTracer: RayTracer): Promise<void>;
    }
}
declare module "main" {
}
