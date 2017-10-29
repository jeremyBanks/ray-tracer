import {Vector} from 'vector';


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
            this.origin.z + this.direction.z * t
        ) || this.origin.add(this.direction.scale(t));
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
    firstHit(ray: Ray): Hit | null {
        return this.hits(ray)[0] || null;
    }

    // hits on this ray that occur in the future (and so will will be drawn).
    hits(ray: Ray): Hit[] {
        return this.allHits(ray).filter(hit => hit.t > 0.0001).sort((a, b) => a.t - b.t);
    }

    // all hits on this ray, potentially including ones that occur backwards/in the past
    allHits(ray: Ray): Hit[] {
        return this.hits(ray);
    }
}


export class Sphere extends Geometry {
    readonly center: Vector;
    readonly radius: number;

    constructor(center: Vector, radius: number) {
        super();
        this.center = center;
        this.radius = radius;
    }

    allHits(ray: Ray): Hit[] { 
        const oc = ray.origin.sub(this.center);
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
                    new Hit(ray, t1, l1, l1.sub(this.center).direction()),
                    new Hit(ray, t2, l2, l2.sub(this.center).direction())
                ];
            } else {
                return [
                    new Hit(ray, t1, l1, l1.sub(this.center).direction()),
                ];
            }
        } else {
            return [];
        }
    }
}


export class Plane extends Geometry {
    readonly origin: Vector;
    readonly normal: Vector;

    constructor(origin: Vector, normal: Vector) {
        super();
        this.origin = origin;
        this.normal = normal;
    }
    
    allHits(ray: Ray): Hit[] {
        const dot = ray.direction.dot(this.normal);
        if (Math.abs(dot) > 0.001) {
            const origin = ray.origin.sub(this.origin);
            const t = this.normal.dot(origin) / -dot;
            return [new Hit(ray, t, ray.at(t), this.normal)];
        }
        return [];
    }
}
