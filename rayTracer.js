"use strict";
class RayTracer {
    constructor() {
        this.width = 512;
        this.height = 256;
        this.scene = [
            new Sphere(V(200, 100, 1500), 300, new Material(new RGB(0.5, 1.0, 0.7))),
            new Sphere(V(-500, -50, 1750), 200, new Material(new RGB(0.3, 0.6, 0.8))),
            // giant red object behind us, which we should never see
            new Sphere(V(0, -0, -5000), 3000, new Material(new RGB(1.0, 0.0, 0.0))),
        ];
        this.focalPoint = V(0, 0, -1024);
        this.sensorCenter = V(0, 0, 0);
        this.canvas = document.createElement('canvas');
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.context = this.canvas.getContext('2d');
        this.image = this.context.createImageData(this.width, this.height);
        this.display = document.createElement('img');
        this.draw();
    }
    draw() {
        this.focalPoint = V(0, 0, -512);
        // give the camera a bit of random tilty drift
        this.sensorCenter = this.sensorCenter.add(V(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1));
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                if (Math.random() > 0.1)
                    continue;
                const pixel = this.drawPixel(x, y).pow(0.45);
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
    }
    drawPixel(x, y) {
        const sensorPoint = this.sensorCenter.sub(V(-(this.width - 1) / 2 + x, -(this.height - 1) / 2 + y));
        // a ray projecting out from the sensor, away from the focal point
        const ray = new Ray(sensorPoint, sensorPoint.sub(this.focalPoint).direction);
        const hits = [];
        for (const hittable of this.scene) {
            hits.push(...hittable.hits(ray));
        }
        hits.sort((a, b) => a.t - b.t);
        const firstHit = hits[0] || null;
        if (firstHit) {
            return new RGB(firstHit.subject.material.color.r * (firstHit.normal.x / 2 + 0.5) * (firstHit.normal.y / 2 + 0.5), firstHit.subject.material.color.g * (firstHit.normal.y / 2 + 0.5), firstHit.subject.material.color.b * (firstHit.normal.z / 2 + 0.5) * (firstHit.normal.y / 2 + 0.5));
        }
        // background, if we draw nothing else, draw a color reflecting the ray's direction.
        return new RGB(ray.direction.x, ray.direction.y, ray.direction.z);
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
}
RGB.BLACK = new RGB(0.0, 0.0, 0.0);
RGB.WHITE = new RGB(1.0, 1.0, 1.0);
/** A vector in euclidian number^3 space */
class Vector {
    constructor(x = 0, y = 0, z = 0) {
        if (Vector.ZERO && Object.is(x, +0) && Object.is(y, +0) && Object.is(z, +0))
            return Vector.ZERO;
        this.x = x;
        this.y = y;
        this.z = z;
        // Vectors are immutable for sanity and optimization.
        Object.freeze(this);
    }
    // scalar/absolute magnitude
    get magnitude() {
        return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
    }
    // directionally-equivalent unit or zero vector
    get direction() {
        if (this.magnitude === 0 || this.magnitude === 1)
            return this;
        return this.scale(1 / this.magnitude);
    }
    // negation
    get negative() {
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
            if (p.magnitude <= 0.5 && p.magnitude > 0) {
                return p.direction;
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
    constructor(origin, direction) {
        this.origin = origin;
        this.direction = direction.direction;
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
        return this.allHits(ray).filter(hit => hit.t > 0).sort((a, b) => a.t - b.t);
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
    constructor(ray, subject, t, normal) {
        this.ray = ray;
        this.subject = subject;
        this.t = t;
        this.location = this.ray.at(t);
        this.normal = normal.direction;
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
        if (discriminant >= 0) {
            // XXX: this is only including one hit
            const t = (-b - Math.sqrt(discriminant)) / (2 * a);
            const hitPoint = ray.at(t);
            const normal = hitPoint.sub(this.center).direction;
            return [new Hit(ray, this, t, normal)];
        }
        return [];
    }
}
const tracer = new RayTracer();
document.body.appendChild(tracer.display);
setInterval(() => tracer.draw(), 100);
