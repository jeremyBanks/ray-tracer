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
            return closestHitItem.material.hitColor(this, TracedHit);
        }
      
        // background, a light color reflecting the ray's direction.
        const a = Math.pow(ray.direction.y + 1 / 2, 2);
        return RGB(a * 0.1, a * 0.2, a * 0.3);
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
