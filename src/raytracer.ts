import {Color, RGB} from './color';
import {Vector, V} from './vector';
import {Ray, Hit, Geometry, Sphere} from './geometry';
import {Camera} from './camera';
import * as settings from './settings';


export class RayTracer {
    readonly canvas: HTMLCanvasElement;
    readonly context: CanvasRenderingContext2D;
    readonly image: ImageData;
    readonly output: HTMLImageElement;

    readonly width = 400;
    readonly height = 300;

    readonly scene = new Scene();

    constructor() {
        this.canvas = document.createElement('canvas');
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.context = this.canvas.getContext('2d') as CanvasRenderingContext2D;
        this.image = this.context.createImageData(this.width, this.height);

        this.output = document.createElement('img');
    }

    async render() {
        let lastTime = Date.now();
        const size = Math.max(this.width, this.height);
        const chunkSize = Math.floor(size / 32);

        // how much we pad inside the potential camera frame on each side to match the target aspect ratio
        const xPadding = (size - this.width) / 2;
        const yPadding = (size - this.height) / 2;

        for (let yOffset = 0; yOffset < this.height; yOffset += chunkSize) {
            for (let xOffset = 0; xOffset < this.width; xOffset += chunkSize) {
                for (let x = xOffset; x < this.width && x < xOffset + chunkSize; x++) {   
                    for (let y = yOffset; y < this.height && y < yOffset + chunkSize; y++) {                     
                        const now = Date.now();
                        if (now - lastTime > 250) {
                            this.context.putImageData(this.image, 0, 0);
                            await new Promise(r => setTimeout(r));
                            lastTime = now;
                        }

                        const samplesPerPixel = 8;
                        const colors: Color[] = [];
                        for (let i = 0; i < samplesPerPixel; i++) {
                            const dx = Math.random() - 0.5;
                            const dy = Math.random() - 0.5;
                            colors.push(this.getRayColor(
                                this.scene.camera.getRay(
                                    (xPadding + x + dx) / (size - 1),
                                    (yPadding + y + dy) / (size - 1))));
                        }
                        const pixel = Color.blend(colors); //.pow(0.45);
        
                        const offset = (y * this.width + x) * 4;
                        this.image.data[offset + 0] = pixel.r8;
                        this.image.data[offset + 1] = pixel.g8;
                        this.image.data[offset + 2] = pixel.b8;
                        this.image.data[offset + 3] = 0xFF;
                    }
                }
            }
        }

        this.context.putImageData(this.image, 0, 0);
        const dataUri = this.canvas.toDataURL();
        this.output.src = dataUri;
    }

    getRayColor(ray: Ray, previousHit?: RayHit): Color {
        if ((previousHit ? previousHit.previousHits : 0) + 1 >= settings.maxBounces) {
            return Color.BLACK;
        }

        let closestHit: Hit | undefined;
        let closestHitItem: Item | undefined;

        for (const item of this.scene.items) {
            const hit = item.geometry.firstHit(ray)
            if (hit && (!closestHit || hit.t < closestHit.t)) {
                closestHit = hit;
                closestHitItem = item;
            }
        }
        
        if (closestHit && closestHitItem) {
            const rayHit = new RayHit(closestHit, closestHitItem, previousHit);
            return closestHitItem.material.hitColor(this, rayHit);
        }
      
        // background, a light color reflecting the ray's direction.
        const a = Math.pow(ray.direction.y + 1 / 2, 2);
        return RGB(a, 0.3 + a, 0.5 + a * 2);
    }
}


/** A material a Hittable can be made of, determining how it's rendered. */
export class Material {
    color: Color = Color.MAGENTA;

    constructor(color: Color) {
        this.color = color;
    }

    hitColor(tracer: RayTracer, rayHit: RayHit): Color {
        return this.color;
    }
}

/** A material that scatters rays, ignoring their incoming angle. */
class MatteMaterial extends Material {
    fuzz = 0.5;

    hitColor(tracer: RayTracer, rayHit: RayHit): Color {
        const colors: [number, Color][] = [];
        const samplesPerBounce = Math.ceil(settings.maxSamplesPerBounce / (rayHit.previousHits + 1));
        for (let i = 0; i < samplesPerBounce; i++) {
            colors.push([1, this.color]);
            const scatteredRay = new Ray(rayHit.hit.location, rayHit.hit.normal.add(Vector.randomUnit().scale(this.fuzz)).direction());
            colors.push([1, tracer.getRayColor(scatteredRay, rayHit)]);
        }
        return Color.blend(colors);
    }
}

/** A material that reflects rays. */
class ShinyMaterial extends Material {
    fuzz = 0.5;

    hitColor(tracer: RayTracer, rayHit: RayHit): Color {
        const direction = rayHit.hit.ray.direction;
        const reflection = direction.sub(rayHit.hit.normal.scale(2 * direction.dot(rayHit.hit.normal))).direction();
        const colors: [number, Color][] = [];
        const samplesPerBounce = Math.ceil(settings.maxSamplesPerBounce / (rayHit.previousHits + 1));
        for (let i = 0; i < samplesPerBounce; i++) {
            colors.push([1, this.color]);
            const reflectedRay = new Ray(rayHit.hit.location, reflection.add(Vector.randomUnit().scale(this.fuzz)).direction());
            colors.push([2, tracer.getRayColor(reflectedRay, rayHit)]);
        }
        return Color.blend(colors);
    }
}

/** A material that refracts rays. */
class GlassMaterial extends Material {
    hitColor(tracer: RayTracer, rayHit: RayHit): Color {
        return Color.RED;
    }
}

/** All of the information about a hit and its ray. */
export class RayHit {
    readonly subject: Item;
    readonly hit: Hit;
    readonly previousHit: RayHit | null;
    readonly previousHits: number;

    constructor(hit: Hit,  subject: Item, previousHit?: RayHit) {
        this.hit = hit;
        this.subject = subject;
        this.previousHit = previousHit || null;
        this.previousHits = previousHit ? previousHit.previousHits + 1 : 0;
    }
}


export class Scene {
    items: Item[] = [
        new Item(new Sphere(V(+125,    50, 1100),   50), new ShinyMaterial(Color.GREEN)),
        new Item(new Sphere(V(   0,    50, 1100),   50), new ShinyMaterial(Color.RED)),
        new Item(new Sphere(V(-125,    50, 1100),   50), new MatteMaterial(Color.BLUE)),
        new Item(new Sphere(V(   0, -1000, 2000), 1000), new MatteMaterial(Color.BLACK)),
        new Item(new Sphere(V( -50,   500, 1400),  400), new MatteMaterial(Color.WHITE)),
    ];

    camera = new Camera();
}


export class Item {
    geometry: Geometry;
    material: Material;

    constructor(geometry: Geometry, material: Material) {
        this.geometry = geometry;
        this.material = material;
    }

    toString() {
        return `${this.material} ${this.geometry}`;
    }
}
