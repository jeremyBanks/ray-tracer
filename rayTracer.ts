class RayTracer {
    canvasWidth = 400;
    canvasHeight = 300;

    // the canvas the image will be drawn on, as it progressively renders.
    canvas: HTMLCanvasElement;
    context: CanvasRenderingContext2D;
    // the image data buffer we modify and write to the canvas.
    image: ImageData;
    // an image element that will be populated with the image once it's complete.
    ouput: HTMLImageElement;

    constructor() {
        this.canvas = document.createElement('canvas');
        this.canvas.width = this.canvasWidth;
        this.canvas.height = this.canvasHeight;
        this.context = this.canvas.getContext('2d') as CanvasRenderingContext2D;
        this.image = this.context.createImageData(this.canvasWidth, this.canvasHeight);

        this.ouput = document.createElement('img');
    }

    async render() {
        let lastTime = Date.now();

        for (let y = 0; y < this.canvasHeight; y++) {
            const now = Date.now();
            if (now - lastTime > 250) {
                // once we've blocked the UI for this long, update canvas and yield for a moment.
                this.context.putImageData(this.image, 0, 0);
                await new Promise(r => setTimeout(r));
                lastTime = now;
            }

            for (let x = 0; x < this.canvasWidth; x++) {
                const color = this.renderPixel(x, y);

                const offset = (y * this.canvasWidth + x) * 4;
                this.image.data[offset + 0] = color.r8;
                this.image.data[offset + 1] = color.g8;
                this.image.data[offset + 2] = color.b8;
                this.image.data[offset + 3] = 0xFF;
            }
        }

        this.context.putImageData(this.image, 0, 0);

        const dataUri = this.canvas.toDataURL();
        this.ouput.src = dataUri;
    }
    
    renderPixel(x: number, y: number): RGBColor {
        const brightness = (x + y) / (this.canvasWidth + this.canvasHeight);

        if (Math.random() < 0.0005) {
            const until = Date.now() + 100;
            while (Date.now() < until); // fake delays to illustrate progressive rendering
        }

        return new RGBColor(brightness, brightness, brightness);
    }
}


/** An RGB number-channel color. */
const RGB = (r: number, g: number, b: number) => new RGBColor(r, g, b);
class RGBColor {
    static BLACK = new RGBColor(0.0, 0.0, 0.0);
    static WHITE = new RGBColor(1.0, 1.0, 1.0);
    static MAGENTA = new RGBColor(1.0, 0.0, 1.0);
    static RED = new RGBColor(1.0, 0.0, 0.0);
    static YELLOW = new RGBColor(1.0, 1.0, 0.0);
    static GREEN = new RGBColor(0.0, 1.0, 0.0);
    static CYAN = new RGBColor(0.0, 1.0, 1.0);
    static BLUE = new RGBColor(0.0, 0.0, 1.0);

    // each channel is a float between 0.0 and 1.0.
    r: number;
    g: number;
    b: number;

    constructor(r: number, g: number, b: number) {
        this.r = Math.min(1.0, Math.max(0.0, r));
        this.g = Math.min(1.0, Math.max(0.0, g));
        this.b = Math.min(1.0, Math.max(0.0, b));
    }
    
    // truncated 8-bit integer values for each channel.
    get r8() { return 0xFF & (this.r * 0xFF); }
    get g8() { return 0xFF & (this.g * 0xFF); }
    get b8() { return 0xFF & (this.b * 0xFF); }

    // raises each channel to the given exponent, such as for gamma transformations.
    pow(exponent: number) {
        return new RGBColor(
            Math.pow(this.r, exponent),
            Math.pow(this.g, exponent),
            Math.pow(this.b, exponent));
    }

    // Blends an array of colors, each optionally with an associated weight.
    static blend(colors: (RGBColor | [number, RGBColor])[]) {
        let r = 0, g = 0, b = 0, max = 0;
        for (const c of colors) {
            let weight: number;
            let color: RGBColor;
            if (c instanceof RGBColor) {
                weight = 1;
                color = c;
            } else {
                [weight, color] = c;
            }
            r += weight * color.r;
            g += weight * color.g;
            b += weight * color.b;
            max += weight;
        }
        return new RGBColor(r / max, g / max, b / max);
    }
}


/** A vector in number^3 space. */
const V = (x: number, y: number, z: number): Vector => new Vector(x, y, z);
class Vector {
    static ZERO = new Vector(+0, +0, +0);
    static X = new Vector(1, 0, 0);
    static Y = new Vector(0, 1, 0);
    static Z = new Vector(0, 0, 1);

    readonly x: number;
    readonly y: number;
    readonly z: number;
  
    constructor(x: number, y: number, z: number) {
        if (Vector.ZERO && Object.is(x, +0) && Object.is(y, +0) && Object.is(z, +0)) return Vector.ZERO;
        
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
        if (this === Vector.ZERO) return this;

        return new Vector(-this.x, -this.y, -this.z);
    }
  
    // addition
    add(other: Vector): Vector {
        if (this === Vector.ZERO) return other;
        if (other === Vector.ZERO) return this;
    
        return new Vector(this.x + other.x, this.y + other.y, this.z + other.z);
    }
    
    // subtraction
    sub(other: Vector): Vector {
        if (other === Vector.ZERO) return this;
        if (other === this) return Vector.ZERO;
    
        return new Vector(this.x - other.x, this.y - other.y, this.z - other.z);
    }
    
    // scale/multiply
    scale(factor: number): Vector {
        if (factor === 0) return Vector.ZERO;
        if (factor === 1) return this;
    
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


const main = () => {
    const tracer = new RayTracer();
    document.body.appendChild(tracer.ouput); 
    document.body.appendChild(tracer.canvas);
    tracer.render();
};

main();
