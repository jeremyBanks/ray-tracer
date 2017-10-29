import {Ray, Hit} from 'geometry';
import {Vector} from 'vector';
import {Color} from 'color';


/** A material a Hittable can be made of, determining how it's rendered. */
export class Material {
    readonly color: Color = Color.MAGENTA;
    readonly colorStrength: number = 1.0;

    constructor(color: Color, opacity: number) {
        this.color = color;
        this.colorStrength = Math.max(0, Math.min(1, opacity));
    }

    /**
     * generate a possible angle of reflection.
     * this can produce randomized results; it will be called multiple times.
     * if possible the random element should be scaled by fuzziness, down to
     * a non-random behaviour at 0.0.
     */
    getReflection(hit: Hit, fuzziness?: number): Vector | null {
        // just let the ray pass through
        return hit.ray.direction;
    }
}


/** A material that scatters rays, ignoring their incoming angle. */
export class MatteMaterial extends Material {
    readonly fuzz = Math.sqrt(Math.random());

    hitColor(tracer: RayTracer, tracedHit: TracedHit): Color {
        const colors: [number, Color][] = [];
        const samplesPerBounce = Math.ceil(tracer.maxSamplesPerBounce / Math.pow(2, tracedHit.previousHits));
        for (let i = 0; i < samplesPerBounce; i++) {
            colors.push([1, this.color]);
            const scatteredRay = new Ray(tracedHit.hit.location, tracedHit.hit.normal.add(Vector.randomUnit().scale(this.fuzz)).direction());
            colors.push([2, tracer.getRayColor(scatteredRay, tracedHit)]);
        }
        return Color.blend(colors);
    }
}


/** A material that reflects rays. */
export class ShinyMaterial extends Material {
    readonly fuzz = Math.pow(Math.random(), 2);

    hitColor(tracer: RayTracer, tracedHit: TracedHit): Color {
        const direction = tracedHit.hit.ray.direction;
        const reflection = direction.sub(tracedHit.hit.normal.scale(2 * direction.dot(tracedHit.hit.normal))).direction();
        const colors: [number, Color][] = [];
        const samplesPerBounce = Math.ceil(tracer.maxSamplesPerBounce / Math.pow(2, tracedHit.previousHits));
        for (let i = 0; i < samplesPerBounce; i++) {
            colors.push([1, this.color]);
            const reflectedRay = new Ray(tracedHit.hit.location, reflection.add(Vector.randomUnit().scale(this.fuzz)).direction());
            colors.push([2, tracer.getRayColor(reflectedRay, tracedHit)]);
        }
        return Color.blend(colors);
    }
}


/** A material that refracts rays. */
export class GlassMaterial extends Material {
    color = Color.BLACK;
}