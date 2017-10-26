const width = 512, height = 256;

/** BROWSER/CANVAS OUTPUT */
const canvas = document.createElement('canvas');
canvas.width = width;
canvas.height = height;
const context = canvas.getContext('2d') as CanvasRenderingContext2D;
const image = context.createImageData(width, height);

const display = document.createElement('img');
document.body.appendChild(display);

const blit = () => {
    context.putImageData(image, 0, 0);
    const dataUri = canvas.toDataURL();
    display.src = dataUri;
};

/** COLOR! */
class RGB {
    r: number;
    g: number;
    b: number;

    constructor(r: number, g: number, b: number) {
        this.r = Math.min(0xFF, Math.max(0, r)) & 0xFF;
        this.g = Math.min(0xFF, Math.max(0, g)) & 0xFF;
        this.b = Math.min(0xFF, Math.max(0, b)) & 0xFF;
    }
}


/** A vector in euclidian number^3 space */
class Vector {
    x: number;
    y: number;
    z: number;
  
    constructor(x: number = 0, y: number = 0, z: number = 0) {
        if (x === 0 && y === 0 && z === 0 && Vector.ZERO) return Vector.ZERO;
        
        this.x = x;
        this.y = y;
        this.z = z;
  
        // Vectors are immutable for sanity.
        Object.freeze(this);
    }
  
    add(other: Vector): Vector {
      if (this === Vector.ZERO) return other;
      if (other === Vector.ZERO) return this;
  
      return new Vector(this.x + other.x, this.y + other.y, this.z + other.z);
    }
    
    sub(other: Vector): Vector {
      if (other === Vector.ZERO) return this;
      if (other === this) return Vector.ZERO;
  
      return new Vector(this.x - other.x, this.y - other.y, this.z - other.z);
    }
    
    get magnitude(): number {
      return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
    }
    
    scale(factor: number): Vector {
      if (factor === 0) return Vector.ZERO;
      if (factor === 1) return this;
  
      return new Vector(this.x * factor, this.y * factor, this.z * factor);
    }
  
    get direction(): Vector {
      if (this.magnitude === 0 || this.magnitude === 1) return this;
      
      return this.scale(1 / this.magnitude);
    }
  
    // a random unit-length vector
    static randomUnit(): Vector {
      // rejection method to avoid bias towards corners
      while (true) {
        const p = new Vector(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5);
        if (p.magnitude <= 0.5 && p.magnitude > 0) {
          return p.direction;
        }
      }
    }
    
    static ZERO = new Vector();
    static X = new Vector(1, 0, 0);
    static Y = new Vector(0, 1, 0);
    static Z = new Vector(0, 0, 1);
};

const V = (x: number = 0, y: number = 0, z: number = 0): Vector => new Vector(x, y, z);

/** A ray proceeding from a point in a constant direction at one of distance per unit of time. */
class Ray {
    origin: Vector;
    direction: Vector;

    constructor(origin: Vector, direction: Vector) {
        this.origin = origin;
        this.direction = direction.direction;
    }

    at(t: number): Vector {
        return this.origin.add(this.direction.scale(t));
    }
}

/** An object our rays can hit. */
abstract class Hittable {
    material: Material;

    hits(ray: Ray): Hit[] {
        return this.allHits(ray).filter(hit => hit.t > 0 && hit.exterior).sort((a, b) => a.t - b.t);
    }

    allHits(ray: Ray): Hit[] {
        return this.hits(ray);
    }
}

/** A material a Hittable can be made of, determining how it's rendered. */
abstract class Material {
    color: RGB;
}

/** Information about a particular hit of a Ray into a Hittable. */
class Hit {
    ray: Ray;
    subject: Hittable;
    t: number;
    exterior: boolean;
}


class Sphere extends Hittable {
    center: Vector;
    radius: number;

    // TODO
}

/** main app loop */
class RayTracer {
    constructor() {
      this.draw();
    }
    
    draw() {
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const pixel = this.drawPixel(x, y);
          const offset = (y * width + x) * 4;
          image.data[offset + 0] = pixel.r;
          image.data[offset + 1] = pixel.g;
          image.data[offset + 2] = pixel.b;
          image.data[offset + 3] = 0xFF;
        }
      }

      blit();
    }
    
    objects: {position: Vector, color: RGB}[] = [
      {
        position: V(0, 0, 5),
        color: new RGB(0x00, 0xFF, 0x80),
      }
    ];
    
    sensorWidth: number = width;
    sensorHeight: number = height;
    focalPoint: Vector = V(0, 0, -1024);
    sensorCenter: Vector = V(0, 0, 0);
    
    drawPixel(x: number, y: number): RGB {
      const sensorPoint = this.sensorCenter.sub(V(-(width - 1) / 2 + x, -(height - 1) / 2 + y));
  
      // a ray projecting out from the sensor, away from the focal point
      const ray = new Ray(sensorPoint, sensorPoint.sub(this.focalPoint).direction);
      
  
      // background, if we draw nothing else
      // we should update this to reflect the distance to the horizon at different angles
      const altitude = (height - 1 - y) / (height - 1);
      const h = Math.floor(x / 16) % 2 ^ Math.floor(y / 16) % 2;
      const nh = 1 - h;
      return new RGB(
        0xFF * (0.9 - 0.3 * altitude) * nh,
        0xFF * (0.0 + 1.2 * altitude) * h,
        0xFF * (0.5 + 0.8 * altitude) * h);
    }
}

new RayTracer();
