import {Color, RGB} from 'color';
import {Vector} from 'vector';
import {Scene, Item} from 'scene';
import {Ray, Hit} from 'geometry';


export class RayTracer {
    readonly scene: Scene;

    readonly maxSamplesPerBounce = 4;
    readonly maxBounces = 8;

    readonly skyColor = RGB(0x02/0xFF);

    constructor(scene: Scene) {
        this.scene = scene;
    }

    getRayColor(ray: Ray, previousHit?: TracedHit): Color {
        if ((previousHit ? previousHit.previousCount : 0) + 1 >= this.maxBounces) {
            return Color.BLACK;
        }

        const itemsByMinDistance = this.scene.items.map(item => {
            // the minimum possible t at which this object could be encountered.
            // may be negative the ray's origin is within those bounds,
            // or negative infinity if the item has no bounds.
            let minDistance = item.geometry.firstPossibleHitT(ray);
            if (minDistance == null) minDistance = +Infinity;
            return {item, minDistance};
        }).sort((a, b) => a.minDistance - b.minDistance);

        let closestHit: Hit | undefined;
        let closestHitItem: Item | undefined;

        for (const {item, minDistance} of itemsByMinDistance) {
            if (closestHit && minDistance >= closestHit.t) {
                // we're looking at objects that will only appear behind
                // the hit we already have.
                break;
            }

            const hit = item.geometry.firstHit(ray);

            if (hit && (!closestHit || hit.t < closestHit.t)) {
                closestHit = hit;
                closestHitItem = item;
            }
        }

        if (closestHit && closestHitItem) {
            const tracedHit = new TracedHit(closestHit, closestHitItem, previousHit);
            const material = closestHitItem.material;

            // halve samples after each bounce, down to minimum of 1.
            const samplesPerBounce = Math.ceil(this.maxSamplesPerBounce / Math.pow(2, tracedHit.previousCount));
            const samples: Color[] = [];
            for (let i = 0; i < samplesPerBounce; i++) {
                const deflection = new Ray(closestHit.location, material.getDeflection(closestHit));
                const color = this.getRayColor(deflection, tracedHit);
                samples.push(color);
            }
            const deflectedColor = Color.blend(...samples);

            if (material.colorMode == 'absorb') {
                const blendColor = Color.blend(
                    [material.colorStrength, material.color],
                    [1 - material.colorStrength, Color.WHITE]);
                return Color.multiply(blendColor, deflectedColor);
            } else {
                const blendColor = Color.blend(
                    [material.colorStrength, material.color],
                    [1 - material.colorStrength, Color.BLACK]);
                return Color.screen(blendColor, deflectedColor);
            }
        }
        
        return this.skyColor;
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
