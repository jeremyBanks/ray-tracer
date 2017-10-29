import {Color, RGB} from 'color';
import {Vector} from 'vector';
import {Scene, Item} from 'scene';
import {Ray, Hit} from 'geometry';


export class RayTracer {
    readonly scene: Scene;

    readonly maxSamplesPerBounce = 2;
    readonly maxBounces = 16;

    constructor(scene: Scene) {
        this.scene = scene;
    }

    getRayColor(ray: Ray, previousHit?: TracedHit): Color {
        if ((previousHit ? previousHit.previousCount : 0) + 1 >= this.maxBounces) {
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
            const tracedHit = new TracedHit(closestHit, closestHitItem, previousHit);
            const material = closestHitItem.material;

            if (material.colorStrength < 1.0) {
                // halve samples after each bounce, down to minimum of 1.
                const samplesPerBounce = Math.ceil(this.maxSamplesPerBounce / Math.pow(2, tracedHit.previousCount));
                const samples: Color[] = [];
                for (let i = 0; i < samplesPerBounce; i++) {
                    const reflection = new Ray(closestHit.location, material.getDeflection(closestHit));
                    const color = this.getRayColor(reflection, tracedHit);
                    samples.push(color);
                }

                return Color.blend(
                    [material.colorStrength, material.color],
                    [1 - material.colorStrength, Color.blend(...samples)]
                );
            } else {
                return material.color;
            }
        }
        
        // background
        const a = Math.sqrt(ray.direction.y * 0.5 + 0.5);
        return RGB(a, a, a);
    }
}


/** All of the information about a hit and its ray. */
export class TracedHit {
    readonly subject: Item;
    readonly hit: Hit;
    readonly previous: TracedHit | null;
    readonly previousCount: number;

    constructor(hit: Hit,  subject: Item, previousHit?: TracedHit) {
        this.hit = hit;
        this.subject = subject;
        this.previous = previousHit || null;
        this.previousCount = previousHit ? previousHit.previousCount + 1 : 0;
    }
}
