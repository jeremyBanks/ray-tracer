import {Vector, V} from 'vector';
import {Geometry, Ray, Hit, Sphere} from 'geometry';


export abstract class VoxelGeometry extends Geometry {

}


export class MaskedGeometry extends VoxelGeometry {
    readonly voxelDistance = 32;
    readonly voxelRadius = 25;

    readonly pixelSize = 16;

    readonly front =
        new Array(this.pixelSize).fill(0).map(
            () => new Array(this.pixelSize).fill(0));
    readonly top =
        new Array(this.pixelSize).fill(0).map(
            () => new Array(this.pixelSize).fill(0));
    readonly side =
        new Array(this.pixelSize).fill(0).map(
            () => new Array(this.pixelSize).fill(0));

    readonly pixelWidth = this.pixelSize;
    readonly pixelHeight = this.pixelSize;
    readonly pixelDepth = this.pixelSize;

    readonly radius = Infinity;

    readonly voxelGeometries: Geometry[] = [];

    constructor(position: Vector) {
        super(position);
        for (let x = 0; x < this.pixelWidth; x++) {
            for (let y = 0; y < this.pixelHeight; y++) {
                for (let z = 0; z < this.pixelDepth; z++) {
                    const yI = this.pixelHeight - 1 - y;
                    const xI = x;
                    const zI = z;
                    this.front[yI][xI] = Math.random() > 0.1 ? 1 : 0;
                    this.side[yI][zI] = Math.random() > 0.1 ? 1 : 0;
                    this.top[zI][xI] = Math.random() > 0.1 ? 1 : 0;
                }
            }
        }


        for (let x = 0; x < this.pixelWidth; x++) {
            for (let y = 0; y < this.pixelHeight; y++) {
                for (let z = 0; z < this.pixelDepth; z++) {
                    const yI = this.pixelHeight - 1 - y;
                    const xI = x;
                    const zI = z;

                    if (this.front[yI][xI] && this.side[yI][zI] && this.top[zI][xI]) {
                        this.voxelGeometries.push(new Sphere(
                            this.position.add(V(
                                x * this.voxelDistance,
                                y * this.voxelDistance,
                                z * this.voxelDistance)),
                            this.voxelRadius
                        ));
                    }
                }
            }
        }
    }

    protected allHits(ray: Ray): Hit[] { 
        return this.voxelGeometries.map(geo => geo.firstHit(ray)).filter(Boolean) as Hit[];
    }

    firstPossibleHitT(ray: Ray): number | null {
        // if (super.firstPossibleHitT(ray) == null) return null;

        let closestHit: number | null = null;
        for (const geo of this.voxelGeometries) {
            const h = geo.firstPossibleHitT(ray);
            if (h !== null && (closestHit === null || h < closestHit)) {
                closestHit = h;
            }
        }

        return closestHit;
    }
}
