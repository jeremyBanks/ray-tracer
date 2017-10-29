import {Ray, Hit} from 'geometry';
import {Vector} from 'vector';
import {Color} from 'color';


/** A material a Hittable can be made of, determining how it's rendered. */
export class Material {
    readonly color: Color;
    readonly colorStrength: number;
    readonly fuzziness: number;

    constructor(color: Color = Color.MAGENTA, colorStrength: number = 1.0, fuzziness: number = 0.0) {
        this.color = color;
        this.colorStrength = Math.max(0, Math.min(1, colorStrength));
        this.fuzziness = Math.max(0, Math.min(1, fuzziness));
    }

    /**
     * generate a possible angle of reflection.
     * this can produce randomized results; it will be called multiple times.
     * if possible the random element should be scaled by fuzziness, down to
     * a non-random behaviour at 0.0.
     */
    getDeflection(hit: Hit): Vector {
        return this.fuzzDirection(hit.ray.direction);
    }

    protected fuzzDirection(direction: Vector): Vector {
        return direction.direction().add(Vector.randomUnit().scale(this.fuzziness)).direction();
    }
}


/** A material that scatters rays, ignoring their incoming angle. */
export class MatteMaterial extends Material {
    static PURE_FUZZ = new MatteMaterial(Color.MAGENTA, 0.0, 1.0);
    static PURE_PROJECTION = new MatteMaterial(Color.MAGENTA, 0.0, 0.0);

    getDeflection(hit: Hit): Vector {
        return this.fuzzDirection(hit.normal);
    }
}


/** A material that reflects rays. */
export class ShinyMaterial extends Material {
    static PURE_FUZZ = new MatteMaterial(Color.MAGENTA, 0.0, 1.0);
    static PURE_REFLECTION = new MatteMaterial(Color.MAGENTA, 0.0, 0.0);

    readonly fuzz = Math.pow(Math.random(), 2);

    getDeflection(hit: Hit): Vector {
        const reflection = hit.ray.direction.sub(hit.normal.scale(2 * hit.ray.direction.dot(hit.normal))).direction();
        return this.fuzzDirection(reflection);
    }
}


/** A material that refracts rays. */
export class GlassMaterial extends Material {
    color = Color.RED;
}