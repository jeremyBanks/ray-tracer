/** A vector in number^3 space. */
export const V = (x: number, y: number, z: number): Vector => new Vector(x, y, z);
export class Vector {
    static ZERO = new Vector(0, 0, 0);
    static X    = new Vector(1, 0, 0);
    static Y    = new Vector(0, 1, 0);
    static Z    = new Vector(0, 0, 1);

    readonly x: number;
    readonly y: number;
    readonly z: number;
  
    constructor(x: number, y: number, z: number) {
        if (!Number.isFinite(x)) console.warn(`x is ${x}`);
        if (!Number.isFinite(y)) console.warn(`y is ${y}`);
        if (!Number.isFinite(z)) console.warn(`z is ${z}`);

        this.x = x;
        this.y = y;
        this.z = z;
    }

    // scalar/absolute magnitude
    private magnitudeValue?: number = undefined;
    magnitude(): number {
        if (this.magnitudeValue == null) {
            this.magnitudeValue = Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
        }
        return this.magnitudeValue;
    }

    // directionally-equivalent unit or zero vector
    private directionValue?: Vector = undefined;
    direction(): Vector {
        if (this.directionValue == null) {
            const magnitude = this.magnitude();
            if (magnitude === 0 || magnitude === 1) {
                this.directionValue = this;
            } else {
                this.directionValue = this.scale(1 / magnitude);
                this.directionValue.magnitudeValue = 1;
                this.directionValue.directionValue = this.directionValue;
            }
        }
        return this.directionValue;
    }

    // negation
    negative(): Vector {
        return new Vector(-this.x, -this.y, -this.z);
    }
  
    // addition
    add(other: Vector): Vector {
        return new Vector(this.x + other.x, this.y + other.y, this.z + other.z);
    }
    
    // subtraction
    sub(other: Vector): Vector {
        return new Vector(this.x - other.x, this.y - other.y, this.z - other.z);
    }
    
    // scale/multiply
    scale(factor: number): Vector {
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
            const magnitude = p.magnitude();
            if (magnitude <= 0.5 && magnitude > 0) {
              return p.direction();
            }
        }
    }
};
