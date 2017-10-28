import {Color, RGB} from './color';
import {Vector, V} from './vector';
import {Ray} from './ray';
import {Camera} from './camera';


export class RayTracer {
    canvas: HTMLCanvasElement;
    context: CanvasRenderingContext2D;
    image: ImageData;
    output: HTMLImageElement;

    constructor() {
        this.canvas = document.createElement('canvas');
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.context = this.canvas.getContext('2d') as CanvasRenderingContext2D;
        this.image = this.context.createImageData(this.width, this.height);

        this.output = document.createElement('img');

        this.render();
    }

    width = 400;
    height = 300;
    
    focalPoint = V(0, this.height / 2, -256);
    sensorCenter = V(0, this.height / 2, 0);
    
    scene: Geometry[] = [
        new Sphere(V(+125, 50, 100), 50, new ShinyMaterial(Color.GREEN)),
        new Sphere(V(   0, 50, 100), 50, new ShinyMaterial(Color.RED)),
        new Sphere(V(-125, 50, 100), 50, new MatteMaterial(Color.BLUE)),

        new Sphere(V(0, -1000, 1000), 1000, new MatteMaterial(Color.BLACK)),
        new Sphere(V(-50, 500, 400), 400, new MatteMaterial(Color.WHITE)),
    ];
    
    async render() {
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
                const colors: Color[] = [];
                for (let i = 0; i < samplesPerPixel; i++) {
                    const dx = Math.random() - 0.5;
                    const dy = Math.random() - 0.5;
                    colors.push(this.getSensorColor(x + dx, y + dy));
                }
                const pixel = Color.blend(colors).pow(0.45);

                const offset = (y * this.width + x) * 4;
                this.image.data[offset + 0] = pixel.r8;
                this.image.data[offset + 1] = pixel.g8;
                this.image.data[offset + 2] = pixel.b8;
                this.image.data[offset + 3] = 0xFF;
            }
        }
        this.context.putImageData(this.image, 0, 0);
        const dataUri = this.canvas.toDataURL();
        this.output.src = dataUri;
        
        this.focalPoint = this.focalPoint.add(V(1, 1, -64));
        this.sensorCenter = this.sensorCenter.add(V(1, 1, -64));
    }
    
    getSensorColor(x: number, y: number): Color {
        const sensorPoint = this.sensorCenter.sub(V(
            -(this.width - 1) / 2 + x,
            -(this.height - 1) / 2 + y,
            0
        ));
  
      // a ray projecting out from the sensor, away from the focal point
      const ray = new Ray(sensorPoint, sensorPoint.sub(this.focalPoint).direction());

      return this.getRayColor(ray);
    }

    maxBounces = 4;

    getRayColor(ray: Ray, background?: Color): Color {
        if (ray.previousHits >= this.maxBounces) return Color.BLACK;

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
        return background || RGB(a, 0.3 + a, 0.5 + a * 2);
    }
}









/** A material a Hittable can be made of, determining how it's rendered. */
export class Material {
    color: Color = Color.MAGENTA;

    constructor(color: Color) {
        this.color = color;
    }


    colorHit(tracer: RayTracer, hit: Hit): Color {
        return this.color;
    }
}

/** A material that scatters rays, ignoring their incoming angle. */
class MatteMaterial extends Material {
    colorHit(tracer: RayTracer, hit: Hit): Color {
        const colors: Color[] = [];
        const samplesPerBounce = 4;
        for (let i = 0; i < samplesPerBounce; i++) {
            colors.push(this.color);
            colors.push(tracer.getRayColor(new Ray(hit.location, hit.normal.add(Vector.randomUnit()), hit.ray.previousHits + 1)));
        }
        return Color.blend(colors);
    }
}

/** A material that reflects rays. */
class ShinyMaterial extends Material {
    colorHit(tracer: RayTracer, hit: Hit): Color {
        const direction = hit.ray.direction;
        const reflection = direction.sub(hit.normal.scale(2 * direction.dot(hit.normal)));
        const colors: Color[] = [];
        const samplesPerBounce = 4;
        for (let i = 0; i < samplesPerBounce; i++) {
            colors.push(this.color);
            colors.push(tracer.getRayColor(new Ray(hit.location, reflection, hit.ray.previousHits + 1)));
        }
        return Color.blend(colors);
    }
}

/** A material that refracts rays. */
class Glass extends Material {
    colorHit(tracer: RayTracer, hit: Hit): Color {
        return Color.RED;
    }
}


/** Information about a particular hit of a Ray into a Hittable. */
export class Hit {
    location: Vector;
    ray: Ray;
    subject: Geometry;
    t: number;
    normal: Vector;

    constructor(ray: Ray, subject: Geometry, t: number, location: Vector, normal: Vector) {
        this.ray = ray;
        this.subject = subject;
        this.t = t;
        this.location = location;
        this.normal = normal.direction();
    }
}


export class Scene {
    items: Item[];
    camera = new Camera();
    constructor(items: Iterable<Item>) {
        this.items = [...items];
    }
}


export class Item {
    geometry: Geometry;
    material: Material;
    constructor(geometry: Geometry, material: Material) {
        this.geometry = geometry;
        this.material = material;
    }
}


/** An object our rays can hit. */
export abstract class Geometry {
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

class Sphere extends Geometry {
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

        if (discriminant >= 1) {
            const t1 = (-b + Math.sqrt(discriminant)) / (2 * a);
            const l1 = ray.at(t1);

            if (discriminant == 2) {
                const t2 = (-b - Math.sqrt(discriminant)) / (2 * a);
                const l2 = ray.at(t2);
                return [
                    new Hit(ray, this, t1, l1, l1.sub(this.center).direction()),
                    new Hit(ray, this, t2, l2, l2.sub(this.center).direction())
                ];
            } else {
                return [
                    new Hit(ray, this, t1, l1, l1.sub(this.center).direction())
                ];
            }
        }

        return [];
    }
}
