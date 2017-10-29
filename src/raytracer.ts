import {Color, RGB} from './color';
import {Vector, V} from './vector';
import {Ray, Hit, Geometry, Sphere} from './geometry';
import {Camera} from './camera';
import {randomChoice} from './util';
import * as settings from './settings';


export class RayTracer {
    readonly scene: Scene;

    constructor(scene: Scene) {
        this.scene = scene;
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
        return RGB(a * 0.1, a * 0.2, a * 0.3);
    }
}


/** A material a Hittable can be made of, determining how it's rendered. */
export class Material {
    readonly color: Color = Color.MAGENTA;

    constructor(color: Color) {
        this.color = color;
    }

    hitColor(tracer: RayTracer, rayHit: RayHit): Color {
        return this.color;
    }
}


/** A material that scatters rays, ignoring their incoming angle. */
class MatteMaterial extends Material {
    readonly fuzz = Math.sqrt(Math.random());

    hitColor(tracer: RayTracer, rayHit: RayHit): Color {
        const colors: [number, Color][] = [];
        const samplesPerBounce = Math.ceil(settings.maxSamplesPerBounce / (rayHit.previousHits + 1));
        for (let i = 0; i < samplesPerBounce; i++) {
            colors.push([1, this.color]);
            const scatteredRay = new Ray(rayHit.hit.location, rayHit.hit.normal.add(Vector.randomUnit().scale(this.fuzz)).direction());
            colors.push([2, tracer.getRayColor(scatteredRay, rayHit)]);
        }
        return Color.blend(colors);
    }
}


/** A material that reflects rays. */
class ShinyMaterial extends Material {
    readonly fuzz = Math.pow(Math.random(), 2);

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
    color = Color.BLACK;
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
    items: Item[] = [];
    camera = new Camera();

    constructor() {
        for (let x = 0; x < 4; x++) for (let y = 0; y < 4; y++) for (let z = 0; z < 4; z++) {
            const geometry = new Sphere(V(-200 + x * 120, 250 - 130 * y, 700 + 200 * z), 50);

            const useGlass = z < 2 && x > 0 && x < 3 && y > 0 && y < 3;

            const color = randomChoice([Color.RED, Color.BLUE, Color.GREEN ]);
            const material = new (randomChoice(useGlass ? [GlassMaterial] : [ShinyMaterial, MatteMaterial]) as any)(color) as Material;
            this.items.push(new Item(geometry, material));
        }
    }
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
