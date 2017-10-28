import {Vector} from './vector';


/** A ray proceeding from a point in a constant direction at one unit distance per one unit time. */
export class Ray {
    origin: Vector;
    direction: Vector;

    // Previous hits whose reflections led to this ray.
    // TODO: move this info into the hit itself?
    previousHits: number;

    constructor(origin: Vector, direction: Vector, previousHits: number = 0) {
        this.origin = origin;
        this.direction = direction.direction();
        this.previousHits = previousHits;
    }

    // The position of the ray at a given time.
    at(t: number): Vector {
        return this.origin.add(this.direction.scale(t));
    }
}
