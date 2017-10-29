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
        const ground = new Item(
                new Plane(V(0, -500, 0), Vector.Y),
                new MatteMaterial(RGB(0.9, 1.0, 0.6), 1.0, 0.9));

        const wall = new Item(
            new Plane(V(-500, 0, 0), Vector.X),
            new ShinyMaterial(RGB(0.75, 0.75, 0.75), 1.0, 0.1));

        this.items.push(ground, wall);

        for (let x = -8; x < 8; x++)
        for (let y = -8; y < 8; y++)
        for (let z = -8; z < 8; z++) {
            if (Math.random() < 0.95) continue;
            
            const position = V(x * 120, 130 * y, 4100 + 200 * z);
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
