import {Vector, V} from 'vector';


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

    // Returns a number providing a lower bound for t when this object could first be hit,
    // or null if we can already cheaply tell that it won't be hit.
    // this just uses the bounding radius and position.
    firstPossibleHitT(ray: Ray): number | null {
        const dX = this.position.x - ray.origin.x;
        const dY = this.position.y - ray.origin.y;
        const dZ = this.position.z - ray.origin.z;

        const vX = ray.direction.x;
        const vY = ray.direction.y;
        const vZ = ray.direction.z;

        const rebasedT = dX * vX + dY * vY + dZ * vZ;
        const minT = rebasedT - this.radius;
        const maxT = rebasedT + this.radius;

        if (maxT < 0) {
            return null;
        }

        const yXP = -vZ * -vX;
        const yYP = vZ * vY;
        const yZP = vX * -vX - vY * vY;
        const yM = Math.sqrt(yXP * yXP + yYP * yYP + yZP * yZP)
        const yX = yXP / yM;
        const yY = yYP / yM;
        const yZ = yZP / yM;

        const x = dX * vY + dY * -vX;
        const y = dX * yX + dY * yY + dZ * yZ;
        
        if (Math.sqrt(x * x + y * y) > this.radius) {
            return null;
        }

        return minT;
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
        const pX = this.position.x;
        const pY = this.position.y;
        const pZ = this.position.z;

        const oX = ray.origin.x;
        const oY = ray.origin.y;
        const oZ = ray.origin.z;
        
        const vX = ray.direction.x;
        const vY = ray.direction.y;
        const vZ = ray.direction.z;

        const dX = oX - pX;
        const dY = oY - pY;
        const dZ = oZ - pZ;

        const a = (vX * vX + vY * vY + vZ * vZ);
        const b = 2.0 * (dX * vX + dY * vY + dZ * vZ);
        const c = (dX * dX + dY * dY + dZ * dZ) - this.radius * this.radius;
        const discriminant = b * b - 4 * a * c;

        if (discriminant >= 1) {
            const t1 = (-b - Math.sqrt(discriminant)) / (2 * a);
            const l1 = V(
                oX + vX * t1,
                oY + vY * t1,
                oZ + vZ * t1);

            if (discriminant == 2) {
                const t2 = (-b + Math.sqrt(discriminant)) / (2 * a);
                const l2 = V(
                    oX + vX * t2,
                    oY + vY * t2,
                    oZ + vZ * t2);
                return [
                    new Hit(ray, t1, l1, V(l1.x - pX, l1.y - pY, l1.z - pZ).direction()),
                    new Hit(ray, t2, l2, V(l2.x - pX, l2.y - pY, l2.z - pZ).direction()),
                ];
            } else {
                return [
                    new Hit(ray, t1, l1, V(l1.x - pX, l1.y - pY, l1.z - pZ).direction()),
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
