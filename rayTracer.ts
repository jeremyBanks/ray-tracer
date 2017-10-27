class RayTracer {
    width = 400;
    height = 300;

    canvas: HTMLCanvasElement;
    context: CanvasRenderingContext2D;
    image: ImageData;
    display: HTMLImageElement;

    constructor() {
        this.canvas = document.createElement('canvas');
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.context = this.canvas.getContext('2d') as CanvasRenderingContext2D;
        this.image = this.context.createImageData(this.width, this.height);

        this.display = document.createElement('img');

        this.draw();
    }
    
    focalPoint: Vector = V(0, 75, -512);
    sensorCenter: Vector = V(0, 75, 0);
    
    async draw() {
        let lastTime = Date.now();
        const ys = notReallyAShuffle(new Array(this.height).fill(null).map((x, i) => i));
        function notReallyAShuffle(array: any[]) {
            for (var i = array.length - 1; i > 0; i--) {
                var j = Math.floor(Math.random() * (i + 1) / 64) * 64 + i % 64;
                [array[i], array[j]] = [array[j], array[i]];
            }
            return array;
        }
        console.log(ys);
        for (const y of ys) {
            const now = Date.now();
            if (now - lastTime > 250) {
                this.context.putImageData(this.image, 0, 0);
                await new Promise(r => setTimeout(r));
                lastTime = now;
            }

            for (let x = 0; x < this.width; x++) {
                const samplesPerPixel = 4;
                const colors: RGB[] = [];
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

                for (let yp = y + 1; yp  < this.height; yp++) {
                    const offset = (yp * this.width + x) * 4;
                    const a = (0xFF * 32) / (32 + Math.abs(yp - y));
                    if (this.image.data[offset + 3] > a) break;

                    this.image.data[offset + 0] = pixel.r8;
                    this.image.data[offset + 1] = pixel.g8;
                    this.image.data[offset + 2] = pixel.b8;
                    this.image.data[offset + 3] = a;
                }
                
                for (let yp = y - 1; yp >= 0; yp--) {
                    const offset = (yp * this.width + x) * 4;
                    const a = (0xFF * 32) / (32 + Math.abs(yp - y));
                    if (this.image.data[offset + 3] > a) break;

                    this.image.data[offset + 0] = pixel.r8;
                    this.image.data[offset + 1] = pixel.g8;
                    this.image.data[offset + 2] = pixel.b8;
                    this.image.data[offset + 3] = a;
                }
            }
        }
        this.context.putImageData(this.image, 0, 0);
        const dataUri = this.canvas.toDataURL();
        this.display.src = dataUri;
        
        this.focalPoint = this.focalPoint.add(V(0, 5, -10));
        this.sensorCenter = this.sensorCenter.add(V(0, 5, -10));

        (this.scene[0] as Sphere).center = (this.scene[0] as Sphere).center.add(V(10, 0, 0));
    }
    
    scene: Hittable[] = [
        new Sphere(V(-50, 30, 10), 30, new Material(RGB.RED)),
        new Sphere(V(150, 50, 20), 50, new Material(RGB.GREEN)),
        new Sphere(V(75, 100, 1000), 100, new Material(RGB.BLUE)),
        new Sphere(V(0, -1050, 250), 1000, new Material(RGB.BLACK)),
        new Sphere(V(-300, 500, 400), 400, new Material(RGB.BLACK)),
    ];
    
    drawSensorPixel(x: number, y: number): RGB {
        const sensorPoint = this.sensorCenter.sub(V(
            -(this.width - 1) / 2 + x,
            -(this.height - 1) / 2 + y
        ));
  
      // a ray projecting out from the sensor, away from the focal point
      const ray = new Ray(sensorPoint, sensorPoint.sub(this.focalPoint).direction);

      return this.getRayColor(ray);
    }

    getRayColor(ray: Ray, background?: RGB): RGB {
        const hit = this.getRayHit(ray);
        if (hit) {
            const colors: RGB[] = [];
            const samplesPerBounce = 4;
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

    // after this many bounces, the ray yields to the background color I guess?
    maxBounces = 4;

    getRayHit(ray: Ray): Hit | null {
        if (ray.previousHits.length >= this.maxBounces) return null;

        const hits: Hit[] = [];
        for (const hittable of this.scene) {
            hits.push(...hittable.hits(ray));
        }
        hits.sort((a, b) => a.t - b.t);
        return hits[0] || null;
    }
}

/** RGB float color. */
class RGB {
    r: number;
    g: number;
    b: number;

    constructor(r: number, g: number, b: number) {
        this.r = Math.min(1.0, Math.max(0.0, r));
        this.g = Math.min(1.0, Math.max(0.0, g));
        this.b = Math.min(1.0, Math.max(0.0, b));
    }
    
    // 8-bit integer values for each channel
    get r8() { return 0xFF & (this.r * 0xFF); }
    get g8() { return 0xFF & (this.g * 0xFF); }
    get b8() { return 0xFF & (this.b * 0xFF); }

    pow(exponent: number) {
        return new RGB(
            Math.pow(this.r, exponent),
            Math.pow(this.g, exponent),
            Math.pow(this.b, exponent));
    }

    static BLACK = new RGB(0.0, 0.0, 0.0);
    static WHITE = new RGB(1.0, 1.0, 1.0);
    static RED = new RGB(1.0, 0.0, 0.0);
    static GREEN = new RGB(0.0, 1.0, 0.0);
    static BLUE = new RGB(0.0, 0.0, 1.0);

    static blend(colors: RGB[]) {
        let r = 0, g = 0, b = 0;
        for (const c of colors) {
            r += c.r;
            g += c.g;
            b += c.b;
        }
        return new RGB(r / colors.length, g / colors.length, b / colors.length);
    }
}


/** A vector in euclidian number^3 space */
class Vector {
    x: number;
    y: number;
    z: number;
  
    constructor(x: number = 0, y: number = 0, z: number = 0) {
        if (Vector.ZERO && Object.is(x, +0) && Object.is(y, +0) && Object.is(z, +0)) return Vector.ZERO;
        
        this.x = x;
        this.y = y;
        this.z = z;
  
        // Vectors are immutable for sanity and optimization.
        Object.freeze(this);
    }

    // scalar/absolute magnitude
    get magnitude(): number {
        return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
    }

    // directionally-equivalent unit or zero vector
    get direction(): Vector {
        if (this.magnitude === 0 || this.magnitude === 1) return this;
    
        return this.scale(1 / this.magnitude);
    }

    // negation
    get negative(): Vector {
        if (this === Vector.ZERO) return this;

        return new Vector(-this.x, -this.y, -this.z);
    }
  
    // addition
    add(other: Vector): Vector {
        if (this === Vector.ZERO) return other;
        if (other === Vector.ZERO) return this;
    
        return new Vector(this.x + other.x, this.y + other.y, this.z + other.z);
    }
    
    // subtraction
    sub(other: Vector): Vector {
        if (other === Vector.ZERO) return this;
        if (other === this) return Vector.ZERO;
    
        return new Vector(this.x - other.x, this.y - other.y, this.z - other.z);
    }
    
    // scale/multiply
    scale(factor: number): Vector {
        if (factor === 0) return Vector.ZERO;
        if (factor === 1) return this;
    
        return new Vector(this.x * factor, this.y * factor, this.z * factor);
    }

    // dot product (scalar product of parallelism :P)
    dot(other: Vector): number {
        return this.x * other.x + this.y * other.y + this.z * other.z;
    }

    // cross product (result perpendicular to both operands)
    cross(other: Vector): Vector {
        return new Vector(
            this.y * other.z - this.z * other.y,
            -this.x * other.z - this.z * other.x,
            this.x * other.y - this.y * other.x); 
    }
  
    // a random unit-length vector
    static randomUnit(): Vector {
        // we generate points within a cube but reject those that fall outside of a sphere
        // to avoid bias towards corner directions.
        while (true) {
            const p = new Vector(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5);
            if (p.magnitude <= 0.5 && p.magnitude > 0) {
              return p.direction;
            }
        }
    }
    
    static ZERO = new Vector(+0, +0, +0);
    static X = new Vector(1, 0, 0);
    static Y = new Vector(0, 1, 0);
    static Z = new Vector(0, 0, 1);
};

const V = (x: number = 0, y: number = 0, z: number = 0): Vector => new Vector(x, y, z);

/** A ray proceeding from a point in a constant direction at one unit distance per one unit time. */
class Ray {
    origin: Vector;
    direction: Vector;

    // Previous hits whose reflections led to this ray.
    previousHits: Hit[];

    constructor(origin: Vector, direction: Vector, previousHits: Hit[] = []) {
        this.origin = origin;
        this.direction = direction.direction;
        this.previousHits = previousHits;
    }

    // The position of the ray at a given time.
    at(t: number): Vector {
        return this.origin.add(this.direction.scale(t));
    }
}


/** An object our rays can hit. */
abstract class Hittable {
    material: Material;

    hit(ray: Ray): Hit | null {
        return this.hits(ray)[0] || null;
    }

    // hits on this ray that occur in the future (and so will will be drawn).
    hits(ray: Ray): Hit[] {
        return this.allHits(ray).filter(hit => hit.t > 0.001).sort((a, b) => a.t - b.t);
    }

    // all hits on this ray, potentially including ones that occur backwards/in the past
    allHits(ray: Ray): Hit[] {
        return this.hits(ray);
    }
}


/** A material a Hittable can be made of, determining how it's rendered. */
class Material {
    color: RGB;

    constructor(color: RGB) {
        this.color = color;
    }

    static VOID = new Material(RGB.BLACK);
}


/** Information about a particular hit of a Ray into a Hittable. */
class Hit {
    location: Vector;
    ray: Ray;
    subject: Hittable;
    t: number;
    normal: Vector;

    constructor(ray: Ray, subject: Hittable, t: number, normal: Vector) {
        this.ray = ray;
        this.subject = subject;
        this.t = t;
        this.location = this.ray.at(t);
        this.normal = normal.direction;
    }
}


class Sphere extends Hittable {
    center: Vector;
    radius: number;

    constructor(center: Vector, radius: number, material: Material = Material.VOID) {
        super();
        this.center = center;
        this.radius = radius;
        this.material = material;
    }

    allHits(ray: Ray): Hit[] { 
        const oc = ray.origin.sub(this.center);
        const a = ray.direction.dot(ray.direction);
        const b = 2.0 * oc.dot(ray.direction);
        const c = oc.dot(oc) - this.radius * this.radius;
        const discriminant = b * b - 4 * a * c;

        const t1 = (-b + Math.sqrt(discriminant)) / (2 * a);
        if (discriminant > 0) {
            const t2 = (-b - Math.sqrt(discriminant)) / (2 * a);
            return [
                new Hit(ray, this, t1, ray.at(t1).sub(this.center).direction),
                new Hit(ray, this, t2, ray.at(t2).sub(this.center).direction)];
        } else if (discriminant == 0) {
            // they're the same point -- our ray is perfectly orthogonal
            return [
                new Hit(ray, this, t1, ray.at(t1).sub(this.center).direction)];
        }

        return [];
    }
}


const tracer = new RayTracer();
document.body.appendChild(tracer.display); 
document.body.appendChild(tracer.canvas);


