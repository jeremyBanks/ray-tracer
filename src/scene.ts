import {Camera} from 'camera';
import {randomChoice} from 'util';
import {Color, RGB} from 'color';
import {Vector, V} from 'vector';
import {MatteMaterial, GlassMaterial, ShinyMaterial, Material, Light} from 'material';
import {Ray, Hit, Geometry, Sphere, Plane} from 'geometry';
import {MaskedGeometry} from 'voxel';


export class Scene {
    items: Item[] = [];
    camera = new Camera();

    constructor() {
        const ground = new Item(
            new Plane(V(0, -500, 0), Vector.Y),
            new MatteMaterial(RGB(0.2, 0.4, 0.1), 1.0, 0.9));

        const sky = new Item(
            new Plane(V(0, 30000, 0), Vector.Y.negative()),
            new MatteMaterial(RGB(0.3, 0.6, 0.9), 0.5, 0.8));
            
        const skyLight = new Item(
            new Plane(V(0, 29000, 0), Vector.Y.negative()),
            new Light(RGB(0.02, 0.04, 0.06)));

        const sun = new Item(
            new Sphere(V(5000, 15000, 0), 10000),
            new Light(RGB(1.0, 1.0, 0.2)));

        this.items.push(ground, sky, skyLight, sun);

        const logo = new Item(
            new MaskedGeometry(V(-100, -100, 1100)),
            new MatteMaterial(RGB(0.4, 0.4, 0.8), 1.0, 0.9));
        this.items.push(logo);

        for (let x = -4; x < 4; x++)
        for (let y = -8; y < 8; y++)
        for (let z = -7; z < 0; z++) {
            if (Math.random() < 0.99) continue;
            
            const position = V(x * 120, -400 + 130 * y, 4100 + 200 * z);
            const geometry = new Sphere(position, Math.random() * 300 + 30);
            
            const color = randomChoice([Color.RED, Color.BLUE, Color.GREEN, Color.WHITE, Color.BLACK]);
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
