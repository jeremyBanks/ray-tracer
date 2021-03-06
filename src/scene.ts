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
        const sun = new Item(
            new Sphere(V(5000, 15000, 0), 10000),
            new Light(RGB(1.0, 1.0, 1.0)));

        this.items.push(sun);

        const miniSuns = [
            new Item(
                new Sphere(V(0, -500, -250), 500),
                new Light(RGB(1, 0, 0))),
            new Item(
                new Sphere(V(500, -500, -250), 500),
                new Light(RGB(0, 1, 0))),
                new Item(
                new Sphere(V(-500, -500, -250), 500),
                new Light(RGB(0, 0, 1))),
            ];

        this.items.push(sun, ...miniSuns);

        const logo = new MaskedGeometry(V(-112, -100, 550));
        for (const geo of logo.voxelGeometries) {
            this.items.push(new Item(
                geo,
                new MatteMaterial(RGB(1), 1.0, 1.9)));
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
