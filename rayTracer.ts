class RayTracer {
    width = 512;
    height = 256;

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
    
    draw() {
        this.focalPoint = V(0, 0, -512);

        // give the camera a bit of random tilty drift
        this.sensorCenter = this.sensorCenter.add(V(
            Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1));

        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                if (Math.random() > 0.01) continue;

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
    
    scene: Hittable[] = [
        new Sphere(V(200, 100, 500), 300, new Material(new RGB(0.5, 1.0, 0.7))),
        new Sphere(V(-500, -50, 750), 200, new Material(new RGB(0.3, 0.6, 0.8))),

        // giant red object behind us, which we should never see
        new Sphere(V(0, -0, -5000), 3000, new Material(new RGB(1.0, 0.0, 0.0))),
    ];
    
    focalPoint: Vector = V(0, 0, -1024);
    sensorCenter: Vector = V(0, 0, 0);
    
    drawPixel(x: number, y: number): RGB {
        const sensorPoint = this.sensorCenter.sub(V(
            -(this.width - 1) / 2 + x,
            -(this.height - 1) / 2 + y
        ));
  
      // a ray projecting out from the sensor, away from the focal point
      const ray = new Ray(sensorPoint, sensorPoint.sub(this.focalPoint).direction);

      const hits: Hit[] = [];
      for (const hittable of this.scene) {
          hits.push(...hittable.hits(ray));
      }
      hits.sort((a, b) => a.t - b.t);
      const firstHit = hits[0] || null;
      if (firstHit) {
          return firstHit.subject.material.color;
      }
      
      // background, if we draw nothing else, draw a color reflecting the ray's direction.
      return new RGB(ray.direction.x, ray.direction.y, ray.direction.z);
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

    constructor(origin: Vector, direction: Vector) {
        this.origin = origin;
        this.direction = direction.direction;
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
        return this.allHits(ray).filter(hit => hit.t > 0).sort((a, b) => a.t - b.t);
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
    ray: Ray;
    subject: Hittable;
    t: number;

    constructor(ray: Ray, subject: Hittable, t: number) {
        this.ray = ray;
        this.subject = subject;
        this.t = t;
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

        if (discriminant >= 0) {
            return [new Hit(ray, this, 42)];
        }

        return [];
    }
}


const tracer = new RayTracer();
document.body.appendChild(tracer.display);

setInterval(() => tracer.draw(), 1000 / 60);