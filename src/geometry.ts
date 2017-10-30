import {Vector} from 'vector';


// fudge factor for floating point inaccuracy
const epsilon = 0.00001;


/** A ray proceeding from a point in a constant direction at one unit distance per one unit time. */
export class Ray {
    origin: Vector;
    direction: Vector;

    constructor(origin: Vector, direction: Vector) {
        this.origin = origin;
        this.direction = direction.direction();
    }

    // The position of the ray at a given time.
    at(t: number): Vector {
        return new Vector(
            this.origin.x + this.direction.x * t,
            this.origin.y + this.direction.y * t,
            this.origin.z + this.direction.z * t);
        // inlined: this.origin.add(this.direction.scale(t));
    }
}


/** The location and surface normal of a ray's hit. */
export class Hit {
    readonly ray: Ray;
    readonly t: number;
    readonly location: Vector;
    readonly normal: Vector;

    constructor(ray: Ray, t: number, location: Vector, normal: Vector) {
        this.ray = ray;
        this.t = t;
        this.location = location;
        this.normal = normal;
    }
}


/** An object our rays can hit. */
export abstract class Geometry {
    readonly position: Vector;
    // non-spheres should still define their maximum bounding radius from position.
    // if they're unbounded (i.e. a full plane) this may be Infinity.
    readonly radius: number;

    constructor(position: Vector, radius: number = Infinity) {
        this.position = position;
        this.radius = radius;
    }

    firstHit(ray: Ray): Hit | null {
        let first: Hit | null = null;
        for (const hit of this.allHits(ray)) {
            if (hit.t > epsilon && (!first || hit.t < first.t)) {
                first = hit;
            }
        }
        return first;
    }

    // all hits on this ray, optionally including ones that occur backwards/in the past
    protected allHits(ray: Ray): Hit[] {
        const hit = this.firstHit(ray);
        return hit ? [hit] : [];
    }
}


export class Sphere extends Geometry {
    protected allHits(ray: Ray): Hit[] { 
        const oc = ray.origin.sub(this.position);
        const a = ray.direction.dot(ray.direction);
        const b = 2.0 * oc.dot(ray.direction);
        const c = oc.dot(oc) - this.radius * this.radius;
        const discriminant = b * b - 4 * a * c;

        if (discriminant >= 1) {
            const t1 = (-b - Math.sqrt(discriminant)) / (2 * a);
            const l1 = ray.at(t1);

            if (discriminant == 2) {
                const t2 = (-b + Math.sqrt(discriminant)) / (2 * a);
                const l2 = ray.at(t2);
                return [
                    new Hit(ray, t1, l1, l1.sub(this.position).direction()),
                    new Hit(ray, t2, l2, l2.sub(this.position).direction())
                ];
            } else {
                return [
                    new Hit(ray, t1, l1, l1.sub(this.position).direction()),
                ];
            }
        } else {
            return [];
        }
    }
}


export class Plane extends Geometry {
    readonly normal: Vector;

    constructor(origin: Vector, normal: Vector) {
        super(origin, Infinity);
        this.normal = normal;
    }
    
    protected allHits(ray: Ray): Hit[] {
        const dot = ray.direction.dot(this.normal);
        if (Math.abs(dot) > epsilon) {
            const origin = ray.origin.sub(this.position);
            const t = this.normal.dot(origin) / -dot;
            return [new Hit(ray, t, ray.at(t), this.normal)];
        }
        return [];
    }
}
