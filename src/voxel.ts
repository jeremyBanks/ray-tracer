import {Vector, V} from 'vector';
import {Geometry, Ray, Hit, Sphere} from 'geometry';


export abstract class VoxelGeometry extends Geometry {

}


export class MaskedGeometry extends VoxelGeometry {
    readonly voxelDistance = 32;
    readonly voxelRadius = 26;

    readonly front = [
        [ , , , , , , , ,],
        [ , , ,1,1, , , ,],
        [ , ,1, , ,1, , ,],
        [ ,1,1,1,1,1,1, ,],
        [1, , , , , , ,1,],
        [ ,1, , , , ,1, ,],
        [1,1,1, , ,1,1,1,],
        [ , , , , , , , ,],
    ];
    readonly top = [
        [1,1,1,1,1,1,1,1,],
        [1,1,1,1,1,1,1,1,],
        [1,1,1,1,1,1,1,1,],
        [1,1,1,1,1,1,1,1,],
        [1,1,1,1,1,1,1,1,],
        [1,1,1,1,1,1,1,1,],
        [1,1,1,1,1,1,1,1,],
        [1,1,1,1,1,1,1,1,],
    ];
    readonly side = [
        [ , , , , , , , ,],
        [ , , , , , ,1, ,],
        [ , , , , ,1,1, ,],
        [ , , , ,1,1,1, ,],
        [ , , ,1,1,1,1, ,],
        [ , ,1,1,1,1,1, ,],
        [ ,1,1,1,1,1,1, ,],
        [ , , , , , , , ,],
    ];

    readonly pixelSize = 8;
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
