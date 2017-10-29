import {Camera} from 'camera';
import {randomChoice} from 'util';
import {Color} from 'color';
import {Vector, V} from 'vector';
import {MatteMaterial, GlassMaterial, ShinyMaterial, Material} from 'material';
import {Ray, Hit, Geometry, Sphere} from 'geometry';

export class Scene {
    items: Item[] = [];
    camera = new Camera();

    constructor() {
        for (let x = 0; x < 4; x++) for (let y = 0; y < 4; y++) for (let z = 0; z < 4; z++) {
            const geometry = new Sphere(V(-200 + x * 120, 250 - 130 * y, 1200 + 200 * z), 50);

            const useGlass = z < 2 && x > 0 && x < 3 && y > 0 && y < 3;
            if (useGlass) continue; // wow! it's invisible! how realistic.

            const color = randomChoice([Color.RED, Color.BLUE, Color.GREEN ]);
            const material = new (randomChoice(useGlass ? [GlassMaterial] : [ShinyMaterial, MatteMaterial]) as any)(color, 0.5 * Math.random(), Math.random()) as Material;
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
