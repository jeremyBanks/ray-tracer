import {Color} from './color';
import {RayTracer} from './raytracer';
import * as settings from './settings';


export class CanvasRenderer {
    readonly canvas: HTMLCanvasElement;
    readonly context: CanvasRenderingContext2D;
    readonly image: ImageData;
    readonly output: HTMLImageElement;

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

        const samples: Color[][][] = [];
        for (let y = 0; y < this.width; y++) {
            const row: Color[][] = [];
            for (let x = 0; x < this.width; x++) {
                row.push([]);
            }
            samples.push(row);
        }

        for (let i = 0; i < settings.samplesPerPixel; i++) {
            if (i > 0) {
                for (let x = 0; x < this.width; x++) for (let y = 0; y < this.height; y++) {
                    // replace the canvas contents with a non-gamma-transformed version, so
                    // it's easier to see the new samples coming in over top.
                    const pixel = Color.blend(samples[y][x]);
                    const offset = (y * this.width + x) * 4;
                    this.image.data[offset + 0] = pixel.r8;
                    this.image.data[offset + 1] = pixel.g8;
                    this.image.data[offset + 2] = pixel.b8;
                    this.image.data[offset + 3] = 0xFF;
                }
                this.context.putImageData(this.image, 0, 0);
                await new Promise(r => setTimeout(r, settings.intraSampleDelay));
            }

            for (let yOffset = 0; yOffset < this.height; yOffset += chunkSize) {
                for (let xOffset = 0; xOffset < this.width; xOffset += chunkSize) {
                    for (let x = xOffset; x < this.width && x < xOffset + chunkSize; x++) {   
                        for (let y = yOffset; y < this.height && y < yOffset + chunkSize; y++) {                     
                            const now = Date.now();
                            if (now - lastTime > 250) {
                                this.context.putImageData(this.image, 0, 0);
                                await new Promise(r => setTimeout(r));
                                lastTime = now;
                            }

                            const dx = Math.random() - 0.5;
                            const dy = Math.random() - 0.5;
                            samples[y][x].push(rayTracer.getRayColor(
                                rayTracer.scene.camera.getRay(
                                    (xPadding + x + dx) / (size - 1),
                                    (yPadding + y + dy) / (size - 1))));
                            
                            const pixel = Color.blend(samples[y][x]).pow(0.45);
            
                            const offset = (y * this.width + x) * 4;
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
