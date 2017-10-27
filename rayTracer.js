"use strict";
class RayTracer {
    constructor() {
        this.width = 200;
        this.height = 150;
        this.focalPoint = V(0, 25, -256);
        this.sensorCenter = V(0, 25, 0);
        this.scene = [
            new Sphere(V(-50, 30, 10), 30, new Material(RGB.RED)),
            new Sphere(V(150, 50, 20), 50, new Material(RGB.GREEN)),
            new Sphere(V(75, 100, 500), 100, new Material(RGB.BLUE)),
            new Sphere(V(0, -1050, 250), 1000, new Material(RGB.BLACK)),
            new Sphere(V(-350, 500, 400), 400, new Material(RGB.BLACK)),
        ];
        // after this many bounces, the ray yields to the background color I guess?
        this.maxBounces = 32;
        this.canvas = document.createElement('canvas');
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.context = this.canvas.getContext('2d');
        this.image = this.context.createImageData(this.width, this.height);
        this.display = document.createElement('img');
        this.draw();
    }
    async draw() {
        let lastTime = Date.now();
        for (let y = 0; y < this.height; y++) {
            const now = Date.now();
            if (now - lastTime > 250) {
                this.context.putImageData(this.image, 0, 0);
                await new Promise(r => setTimeout(r));
                lastTime = now;
            }
            for (let x = 0; x < this.width; x++) {
                const samplesPerPixel = 2;
                const colors = [];
                for (let i = 0; i < samplesPerPixel; i++) {
                    const dx = Math.random() - 0.5;
                    const dy = Math.random() - 0.5;
                    colors.push(this.drawSensorPixel(x + dx, y + dy));
                }
                const pixel = RGB.blend(colors).pow(0.45);
                const offset = (y * this.width + x) * 4;
                this.image.data[offset + 0] = pixel.r8;
                this.image.data[offset + 1] = pixel.g8;
                this.image.data[offset + 2] = pixel.b8;
                this.image.data[offset + 3] = 0xFF;
            }
        }
        this.context.putImageData(this.image, 0, 0);
        const dataUri = this.canvas.toDataURL();
        this.display.src = dataUri;
        this.focalPoint = this.focalPoint.add(V(1, 1, -64));
        this.sensorCenter = this.sensorCenter.add(V(1, 1, -64));
    }
    drawSensorPixel(x, y) {
        const sensorPoint = this.sensorCenter.sub(V(-(this.width - 1) / 2 + x, -(this.height - 1) / 2 + y));
        // a ray projecting out from the sensor, away from the focal point
        const ray = new Ray(sensorPoint, sensorPoint.sub(this.focalPoint).direction());
        return this.getRayColor(ray);
    }
    getRayColor(ray, background) {
        const hit = this.getRayHit(ray);
        if (hit) {
            const colors = [];
            const samplesPerBounce = 1;
            for (let i = 0; i < samplesPerBounce; i++) {
                colors.push(RGB.BLACK);
                colors.push(hit.subject.material.color);
                colors.push(this.getRayColor(new Ray(hit.location, hit.location.add(hit.normal).add(Vector.randomUnit()), [hit].concat(ray.previousHits))));
            }
            return RGB.blend(colors);
        }
        // background, defaulting to a color reflecting the ray's direction.
        const a = Math.pow(ray.direction.y + 1 / 2, 2);
        return background || new RGB(a, 0.3 + a, 0.5 + a * 2);
    }
    getRayHit(ray) {
        if (ray.previousHits.length >= this.maxBounces)
            return null;
        const hits = [];
        for (const hittable of this.scene) {
            hits.push(...hittable.hits(ray));
        }
        hits.sort((a, b) => a.t - b.t);
        return hits[0] || null;
    }
}
/** RGB float color. */
class RGB {
    constructor(r, g, b) {
        this.r = Math.min(1.0, Math.max(0.0, r));
        this.g = Math.min(1.0, Math.max(0.0, g));
        this.b = Math.min(1.0, Math.max(0.0, b));
    }
    // 8-bit integer values for each channel
    get r8() { return 0xFF & (this.r * 0xFF); }
    get g8() { return 0xFF & (this.g * 0xFF); }
    get b8() { return 0xFF & (this.b * 0xFF); }
    pow(exponent) {
        return new RGB(Math.pow(this.r, exponent), Math.pow(this.g, exponent), Math.pow(this.b, exponent));
    }
    static blend(colors) {
        let r = 0, g = 0, b = 0;
        for (const c of colors) {
            r += c.r;
            g += c.g;
            b += c.b;
        }
        return new RGB(r / colors.length, g / colors.length, b / colors.length);
    }
}
RGB.BLACK = new RGB(0.0, 0.0, 0.0);
RGB.WHITE = new RGB(1.0, 1.0, 1.0);
RGB.RED = new RGB(1.0, 0.0, 0.0);
RGB.GREEN = new RGB(0.0, 1.0, 0.0);
RGB.BLUE = new RGB(0.0, 0.0, 1.0);
/** A vector in euclidian number^3 space */
class Vector {
    constructor(x = 0, y = 0, z = 0) {
        // scalar/absolute magnitude
        this.magnitudeValue = undefined;
        // directionally-equivalent unit or zero vector
        this.directionValue = undefined;
        if (Vector.ZERO && Object.is(x, +0) && Object.is(y, +0) && Object.is(z, +0))
            return Vector.ZERO;
        this.x = x;
        this.y = y;
        this.z = z;
    }
    magnitude() {
        if (this.magnitudeValue == null) {
            this.magnitudeValue = Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
        }
        return this.magnitudeValue;
    }
    direction() {
        if (this.directionValue == null) {
            const magnitude = this.magnitude();
            if (magnitude === 0 || magnitude === 1) {
                this.directionValue = this;
            }
            else {
                this.directionValue = this.scale(1 / magnitude);
                this.directionValue.magnitudeValue = 1;
                this.directionValue.directionValue = this.directionValue;
            }
        }
        return this.directionValue;
    }
    // negation
    negative() {
        if (this === Vector.ZERO)
            return this;
        return new Vector(-this.x, -this.y, -this.z);
    }
    // addition
    add(other) {
        if (this === Vector.ZERO)
            return other;
        if (other === Vector.ZERO)
            return this;
        return new Vector(this.x + other.x, this.y + other.y, this.z + other.z);
    }
    // subtraction
    sub(other) {
        if (other === Vector.ZERO)
            return this;
        if (other === this)
            return Vector.ZERO;
        return new Vector(this.x - other.x, this.y - other.y, this.z - other.z);
    }
    // scale/multiply
    scale(factor) {
        if (factor === 0)
            return Vector.ZERO;
        if (factor === 1)
            return this;
        return new Vector(this.x * factor, this.y * factor, this.z * factor);
    }
    // dot product (scalar product of parallelism :P)
    dot(other) {
        return this.x * other.x + this.y * other.y + this.z * other.z;
    }
    // cross product (result perpendicular to both operands)
    cross(other) {
        return new Vector(this.y * other.z - this.z * other.y, -this.x * other.z - this.z * other.x, this.x * other.y - this.y * other.x);
    }
    // a random unit-length vector
    static randomUnit() {
        // we generate points within a cube but reject those that fall outside of a sphere
        // to avoid bias towards corner directions.
        while (true) {
            const p = new Vector(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5);
            const magnitude = p.magnitude();
            if (magnitude <= 0.5 && magnitude > 0) {
                return p.direction();
            }
        }
    }
}
Vector.ZERO = new Vector(+0, +0, +0);
Vector.X = new Vector(1, 0, 0);
Vector.Y = new Vector(0, 1, 0);
Vector.Z = new Vector(0, 0, 1);
;
const V = (x = 0, y = 0, z = 0) => new Vector(x, y, z);
/** A ray proceeding from a point in a constant direction at one unit distance per one unit time. */
class Ray {
    constructor(origin, direction, previousHits = []) {
        this.origin = origin;
        this.direction = direction.direction();
        this.previousHits = previousHits;
    }
    // The position of the ray at a given time.
    at(t) {
        return this.origin.add(this.direction.scale(t));
    }
}
/** An object our rays can hit. */
class Hittable {
    hit(ray) {
        return this.hits(ray)[0] || null;
    }
    // hits on this ray that occur in the future (and so will will be drawn).
    hits(ray) {
        return this.allHits(ray).filter(hit => hit.t > 0.0001).sort((a, b) => a.t - b.t);
    }
    // all hits on this ray, potentially including ones that occur backwards/in the past
    allHits(ray) {
        return this.hits(ray);
    }
}
/** A material a Hittable can be made of, determining how it's rendered. */
class Material {
    constructor(color) {
        this.color = color;
    }
}
Material.VOID = new Material(RGB.BLACK);
/** Information about a particular hit of a Ray into a Hittable. */
class Hit {
    constructor(ray, subject, t, location, normal) {
        this.ray = ray;
        this.subject = subject;
        this.t = t;
        this.location = location;
        this.normal = normal.direction();
    }
}
class Sphere extends Hittable {
    constructor(center, radius, material = Material.VOID) {
        super();
        this.center = center;
        this.radius = radius;
        this.material = material;
    }
    allHits(ray) {
        const oc = ray.origin.sub(this.center);
        const a = ray.direction.dot(ray.direction);
        const b = 2.0 * oc.dot(ray.direction);
        const c = oc.dot(oc) - this.radius * this.radius;
        const discriminant = b * b - 4 * a * c;
        const t1 = (-b + Math.sqrt(discriminant)) / (2 * a);
        const l1 = ray.at(t1);
        if (discriminant > 0) {
            const t2 = (-b - Math.sqrt(discriminant)) / (2 * a);
            const l2 = ray.at(t2);
            return [
                new Hit(ray, this, t1, l1, l1.sub(this.center).direction()),
                new Hit(ray, this, t2, l2, l2.sub(this.center).direction())
            ];
        }
        else if (discriminant == 0) {
            return [
                new Hit(ray, this, t1, l1, l1.sub(this.center).direction())
            ];
        }
        return [];
    }
}
const tracer = new RayTracer();
document.body.appendChild(tracer.display);
document.body.appendChild(tracer.canvas);
const f = async () => {
    await tracer.draw();
    // document.body.insertBefore(tracer.display.cloneNode(), document.body.firstChild);
    setTimeout(f, 1000 / 32);
};
f();
