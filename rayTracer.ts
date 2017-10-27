class RayTracer {
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

    width = 400;
    height = 300;
    
    focalPoint = V(0, this.height / 2, -256);
    sensorCenter = V(0, this.height / 2, 0);
    
    scene: Hittable[] = [
        new Sphere(V(+100, 50, 20), 50, new MatteMaterial(RGB.GREEN)),
        new Sphere(V(   0, 50, 20), 50, new ShinyMaterial(RGB.RED)),
        new Sphere(V(-100, 50, 20), 50, new MatteMaterial(RGB.BLUE)),
        new Sphere(V(0, -1000, 20), 1000, new MatteMaterial(RGB.BLACK)),
        new Sphere(V(-50, 500, 50), 400, new MatteMaterial(RGB.BLACK)),
    ];
    
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
                const samplesPerPixel = 8;
                const colors: RGB[] = [];
                for (let i = 0; i < samplesPerPixel; i++) {
                    const dx = Math.random() - 0.5;
                    const dy = Math.random() - 0.5;
                    colors.push(this.getSensorColor(x + dx, y + dy));
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
    
    getSensorColor(x: number, y: number): RGB {
        const sensorPoint = this.sensorCenter.sub(V(
            -(this.width - 1) / 2 + x,
            -(this.height - 1) / 2 + y
        ));
  
      // a ray projecting out from the sensor, away from the focal point
      const ray = new Ray(sensorPoint, sensorPoint.sub(this.focalPoint).direction());

      return this.getRayColor(ray);
    }

    maxBounces = 2;

    getRayColor(ray: Ray, background?: RGB): RGB {
        if (ray.previousHits >= this.maxBounces) return RGB.BLACK;

        const hits: Hit[] = [];
        for (const hittable of this.scene) {
            hits.push(...hittable.hits(ray));
        }
        hits.sort((a, b) => a.t - b.t);
        
        if (hits.length > 0) {
            const hit = hits[0]
            return hit.subject.material.colorHit(this, hit);
        }
      
        // background, defaulting to a color reflecting the ray's direction.
        const a = Math.pow(ray.direction.y + 1 / 2, 2);
        return background || new RGB(a, 0.3 + a, 0.5 + a * 2);
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
    static MAGENTA = new RGB(1.0, 0.0, 1.0);
    static RED = new RGB(1.0, 0.0, 0.0);
    static YELLOW = new RGB(1.0, 1.0, 0.0);
    static GREEN = new RGB(0.0, 1.0, 0.0);
    static CYAN = new RGB(0.0, 1.0, 1.0);
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
    readonly x: number;
    readonly y: number;
    readonly z: number;
  
    constructor(x: number = 0, y: number = 0, z: number = 0) {
        if (Vector.ZERO && Object.is(x, +0) && Object.is(y, +0) && Object.is(z, +0)) return Vector.ZERO;
        
        this.x = x;
        this.y = y;
        this.z = z;
    }

    // scalar/absolute magnitude
    private magnitudeValue?: number = undefined;
    magnitude(): number {
        if (this.magnitudeValue == null) {
            this.magnitudeValue = Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
        }
        return this.magnitudeValue;
    }

    // directionally-equivalent unit or zero vector
    private directionValue?: Vector = undefined;
    direction(): Vector {
        if (this.directionValue == null) {
            const magnitude = this.magnitude();
            if (magnitude === 0 || magnitude === 1) {
                this.directionValue = this;
            } else {
                this.directionValue = this.scale(1 / magnitude);
                this.directionValue.magnitudeValue = 1;
                this.directionValue.directionValue = this.directionValue;
            }
        }
        return this.directionValue;
    }

    // negation
    negative(): Vector {
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
            const magnitude = p.magnitude();
            if (magnitude <= 0.5 && magnitude > 0) {
              return p.direction();
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


/** An object our rays can hit. */
abstract class Hittable {
    material: Material;

    hit(ray: Ray): Hit | null {
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


/** A material a Hittable can be made of, determining how it's rendered. */
class Material {
    color: RGB = RGB.MAGENTA;

    constructor(color: RGB) {
        this.color = color;
    }


    colorHit(tracer: RayTracer, hit: Hit): RGB {
        return this.color;
    }
}

/** A material that scatters rays, ignoring their incoming angle. */
class MatteMaterial extends Material {
    colorHit(tracer: RayTracer, hit: Hit): RGB {
        const colors: RGB[] = [];
        const samplesPerBounce = 4;
        for (let i = 0; i < samplesPerBounce; i++) {
            colors.push(this.color);
            colors.push(tracer.getRayColor(new Ray(hit.location, hit.normal.add(Vector.randomUnit()), hit.ray.previousHits + 1)));
        }
        return RGB.blend(colors);
    }
}

/** A material that reflects rays. */
class ShinyMaterial extends Material {
    colorHit(tracer: RayTracer, hit: Hit): RGB {
        const direction = hit.ray.direction;
        const reflection = direction.sub(hit.normal.scale(2 * direction.dot(hit.normal)));
        return tracer.getRayColor(new Ray(hit.location, reflection, hit.ray.previousHits + 1));
    }
}

/** A material that refracts rays. */
class Glass extends Material {
    colorHit(tracer: RayTracer, hit: Hit): RGB {
        return RGB.RED;
    }
}


/** Information about a particular hit of a Ray into a Hittable. */
class Hit {
    location: Vector;
    ray: Ray;
    subject: Hittable;
    t: number;
    normal: Vector;

    constructor(ray: Ray, subject: Hittable, t: number, location: Vector, normal: Vector) {
        this.ray = ray;
        this.subject = subject;
        this.t = t;
        this.location = location;
        this.normal = normal.direction();
    }
}


class Sphere extends Hittable {
    center: Vector;
    radius: number;

    constructor(center: Vector, radius: number, material: Material) {
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
        const l1 = ray.at(t1);
        if (discriminant > 0) {
            const t2 = (-b - Math.sqrt(discriminant)) / (2 * a);
            const l2 = ray.at(t2);
            return [
                new Hit(ray, this, t1, l1, l1.sub(this.center).direction()),
                new Hit(ray, this, t2, l2, l2.sub(this.center).direction())
            ];
        } else if (discriminant == 0) {
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
    // await tracer.draw();
    // document.body.insertBefore(tracer.display.cloneNode(), document.body.firstChild);
    // setTimeout(f, 1000 * 30);
};

f();
