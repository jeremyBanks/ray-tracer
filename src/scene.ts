import {Camera} from 'camera';
import {randomChoice} from 'util';
import {Color, RGB} from 'color';
import {Vector, V} from 'vector';
import {MatteMaterial, GlassMaterial, ShinyMaterial, Material} from 'material';
import {Ray, Hit, Geometry, Sphere, Plane} from 'geometry';

export class Scene {
    items: Item[] = [];
    camera = new Camera();

    constructor() {
        this.items.push(
            new Item(
                new Plane(V(0, -450, 0), Vector.Y),
                new MatteMaterial(RGB(0.15, 0.15, 0.15), 1.0, 0.5)));
        
        this.items.push(
            new Item(
                new Plane(V(0, 0, 5000), Vector.Z.negative()),
                new ShinyMaterial(RGB(0.5, 0.5, 0.5), 1.0, 0.1)));

        for (let x = -8; x < 8; x++)
        for (let y = -8; y < 8; y++)
        for (let z = -8; z < 8; z++) {
            if (Math.random() < 0.95) continue;
            
            const position = V(x * 120, 130 * y, 2000 + 200 * z);
            const geometry = new Sphere(position, Math.random() * 30 + 30);

            const color = randomChoice([Color.RED, Color.BLUE, Color.GREEN ]);
            const material = new (randomChoice([ShinyMaterial, MatteMaterial]) as any)(color, 0.5 * Math.random(), Math.random()) as Material;
            this.items.push(new Item(geometry, material));
        }
    }
}


export class Item {
    geometry: Geometry;
    material: Material;

    constructor(geometry: Geometry, material: Material) {
        this.geometry = geometry;
        this.material = material;
    }

    toString() {
        return `${this.material} ${this.geometry}`;
    }
}
