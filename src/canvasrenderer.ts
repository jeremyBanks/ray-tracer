import {Color} from 'color';
import {RayTracer} from 'raytracer';


export class CanvasRenderer {
    readonly canvas: HTMLCanvasElement;
    readonly context: CanvasRenderingContext2D;
    readonly image: ImageData;
    readonly output: HTMLImageElement;
    readonly debugger: HTMLElement;

    readonly samplesPerPixel = Infinity;
    readonly intraSampleDelay = 0;

    readonly width: number;
    readonly height: number;

    readonly gammaPower = 0.45;
    
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
        this.debugger = document.createElement('pre');
        this.debugger.classList.add('debugger');
    }

    async render(rayTracer: RayTracer) {
        let lastTime = Date.now();
        const size = Math.max(this.width, this.height);
        const chunkSize = Math.floor(size / 16);

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

        let lastPassStartTime = 0;
        const passDurations: number[] = [];
        for (let i = 0; i < this.samplesPerPixel; i++) {
            if (i > 0) {
                const passDuration = Date.now() - lastPassStartTime;
                passDurations.push(passDuration);
                passDurations.sort();
                const medianDuration = passDurations[Math.floor(passDurations.length / 2)];
                const minDuration = Math.min(...passDurations);
                this.debugger.textContent =
                    `     ${i} passes\n` +
                    `  best: ${minDuration} ms\n` +
                    `median: ${medianDuration} ms\n` +
                    `latest: ${passDuration} ms\n`;
                await new Promise(r => setTimeout(r, this.intraSampleDelay));
            }
            lastPassStartTime = Date.now();

            for (let yOffset = 0; yOffset < this.height; yOffset += chunkSize) {
                for (let xOffset = 0; xOffset < this.width; xOffset += chunkSize) {
                    const now = Date.now();
                    if (now - lastTime > 1000 / 8) {
                        const cursor = Color.RED;    
                        for (let x = xOffset; x < this.width && x < xOffset + chunkSize; x++) {
                            for (let y = yOffset; y < this.height && y < yOffset + chunkSize; y++) {
                                const offset = (y * this.width + x) * 4;
                                this.image.data[offset + 0] = 0xFF - (this.image.data[offset + 0]/2)|0;
                                this.image.data[offset + 1] = 0xFF - this.image.data[offset + 1];
                                this.image.data[offset + 2] = 0xFF - this.image.data[offset + 2];
                                this.image.data[offset + 3] = 0xFF;
                            }
                        }

                        this.context.putImageData(this.image, 0, 0);
                        await new Promise(r => setTimeout(r));
                        lastTime = now;
                    }

                    for (let x = xOffset; x < this.width && x < xOffset + chunkSize; x++) {
                        for (let y = yOffset; y < this.height && y < yOffset + chunkSize; y++) {
                            const offset = (y * this.width + x) * 4;

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

            this.context.putImageData(this.image, 0, 0);
            const dataUri = this.canvas.toDataURL();
            this.output.src = dataUri;
        }
    }
}
