import {Color} from 'color';
import {RayTracer} from 'raytracer';


export class CanvasRenderer {
    readonly canvas: HTMLCanvasElement;
    readonly context: CanvasRenderingContext2D;
    readonly image: ImageData;
    readonly output: HTMLImageElement;

    readonly samplesPerPixel = Infinity;
    readonly intraSampleDelay = 125;

    readonly width: number;
    readonly height: number;
    
    constructor(width: number = 256, height: number = width) {
        this.width = width;
        this.height = height;
        this.canvas = document.createElement('canvas');
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.context = this.canvas.getContext('2d') as CanvasRenderingContext2D;
        this.image = this.context.createImageData(this.width, this.height);
        this.output = document.createElement('img');
        this.output.width = this.width;
        this.output.height = this.height;
    }

    async render(rayTracer: RayTracer) {
        let lastTime = Date.now();
        const size = Math.max(this.width, this.height);
        const chunkSize = Math.floor(size / 32);

        // how much we pad inside the potential camera frame on each side to match the target aspect ratio
        const xPadding = (size - this.width) / 2;
        const yPadding = (size - this.height) / 2;
        
        this.context.clearRect(0, 0, this.width, this.height);
        this.output.src = this.canvas.toDataURL();

        type PixelSamples = {
            samples: Color[],
            deviation: number,
        };

        const pixels: PixelSamples[][] = [];
        for (let y = 0; y < this.width; y++) {
            const row: PixelSamples[] = [];
            for (let x = 0; x < this.width; x++) {
                row.push({samples: [], deviation: 1});
            }
            pixels.push(row);
        }

        let meanDev = 0;
        const iOffset = 12;
        for (let i = iOffset; i < this.samplesPerPixel; i++) {
            if (i > iOffset) {
                for (let x = 0; x < this.width; x++) for (let y = 0; y < this.height; y++) {
                    // replace the canvas contents with a non-gamma-transformed version, so
                    // it's easier to see the new samples coming in over top.
                    const pixel = Color.blend(...pixels[y][x].samples);
                    const offset = (y * this.width + x) * 4;
                    this.image.data[offset + 0] = pixel.r8;
                    this.image.data[offset + 1] = pixel.g8;
                    this.image.data[offset + 2] = pixel.b8;
                    this.image.data[offset + 3] = 0xFF;
                }
                this.context.putImageData(this.image, 0, 0);
                await new Promise(r => setTimeout(r, this.intraSampleDelay));
            }

            const stdDev = (xs: number[]): number => {
                if (xs.length <= 1) return 0;
                const sum = xs.reduce((a, b) => a + b);
                const mean = sum / xs.length;
                const squaredDeviations = xs.map(x => Math.pow(x - mean, 2));
                const squaredDeviationsSum = squaredDeviations.reduce((a, b) => a + b);
                return Math.sqrt(squaredDeviationsSum / (xs.length - 1));
            }

            const precisionInterval = 16;

            if (i >= precisionInterval && (i % precisionInterval == 1)) {
                const allDevs: number[] = [];
                let minDev = +Infinity;
                let maxDev = -Infinity;
                for (const row of pixels) {
                    for (const pixel of row) {
                        const dev = stdDev(pixel.samples.map(p => p.r)) + stdDev(pixel.samples.map(p => p.g)) + stdDev(pixel.samples.map(p => p.b));
                        if (dev < minDev) {
                            minDev = dev;
                        }
                        if (dev > maxDev) {
                            maxDev = dev;
                        }
                        allDevs.push(dev);
                    }
                }
                meanDev = allDevs.reduce((a, b) => a + b) / allDevs.length;
                for (const row of pixels) {
                    for (const pixel of row) {
                        const dev = stdDev(pixel.samples.map(p => p.r)) + stdDev(pixel.samples.map(p => p.g)) + stdDev(pixel.samples.map(p => p.b));
                        pixel.deviation = (dev - minDev) / (maxDev - minDev);
                    }
                }
            }

            for (let yOffset = 0; yOffset < this.height; yOffset += chunkSize) {
                for (let xOffset = 0; xOffset < this.width; xOffset += chunkSize) {
                    for (let x = xOffset; x < this.width && x < xOffset + chunkSize; x++) {
                        const now = Date.now();
                        if (now - lastTime > 250) {
                            this.context.putImageData(this.image, 0, 0);
                            await new Promise(r => setTimeout(r));
                            lastTime = now;
                        }

                        for (let y = yOffset; y < this.height && y < yOffset + chunkSize; y++) {
                            const offset = (y * this.width + x) * 4;

                            if (meanDev && pixels[y][x].deviation < Math.sqrt((i % precisionInterval)/precisionInterval)) {
                                this.image.data[offset + 0] = 0;
                                this.image.data[offset + 1] = 0;
                                this.image.data[offset + 2] = 0;
                                this.image.data[offset + 3] = 0xFF;
                                continue;
                            }

                            const dx = Math.random() - 0.5;
                            const dy = Math.random() - 0.5;
                            pixels[y][x].samples.push(rayTracer.getRayColor(
                                rayTracer.scene.camera.getRay(
                                    (xPadding + x + dx) / (size - 1),
                                    (yPadding + y + dy) / (size - 1))));
                            
                            const pixel = Color.blend(...pixels[y][x].samples).pow(0.45);
            
                            this.image.data[offset + 0] = pixel.r8;
                            this.image.data[offset + 1] = pixel.g8;
                            this.image.data[offset + 2] = pixel.b8;
                            this.image.data[offset + 3] = 0xFF;
                        }
                    }
                }
            }

            for (let x = 0; x < this.width; x++) for (let y = 0; y < this.height; y++) {
                const pixel = Color.blend(...pixels[y][x].samples).pow(0.45);
                const offset = (y * this.width + x) * 4;
                this.image.data[offset + 0] = pixel.r8;
                this.image.data[offset + 1] = pixel.g8;
                this.image.data[offset + 2] = pixel.b8;
                this.image.data[offset + 3] = 0xFF;
            }
            this.context.putImageData(this.image, 0, 0);
            const dataUri = this.canvas.toDataURL();
            this.output.src = dataUri;
        }
    }
}
