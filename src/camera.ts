import {Vector, V} from './vector';
import {Ray} from './ray';


export class Camera {
    readonly location = V(0.0, 0.0, 0.0);
    readonly direction = V(0.0, 0.0, 1.0);
    readonly depth = 2.0;
    readonly focalPoint = this.location.sub(this.direction.scale(this.depth));

    readonly width = 1.0;
    readonly height = 1.0;
    protected readonly halfWidth = this.width / 2.0;
    protected readonly halfHeight = this.height / 2.0;

    moveTo(location: Vector): Camera {
        // this.location = location;
        return this;
    }

    lookAt(location: Vector): Camera {
        // this.direction = location.sub(this.location).direction();
        throw new Error('not implemented');
    }

    // sets the lens depth so that it will obtain this fov given a 1-unit width/height
    setFov(degrees: number): Camera {
        throw new Error('not implemented');
    }

    // gets the ray leaving the lens of this camera at fractions x and y of
    // the way across the width and height of the lens.
    getRay(x: number, y: number) {
        if (x < 0 || x > 1) throw new Error(`x is ${x}, out of bounds`);
        if (y < 0 || y > 1) throw new Error(`y is ${y}, out of bounds`);

        // This only works for our hard-coded direction V(0, 0, 1).
        const lensPoint = this.location.add(V(
            -this.halfWidth + x * this.width, -this.halfHeight + y * this.height, 0));
        
        return new Ray(lensPoint, lensPoint.sub(this.focalPoint));
    }
}
