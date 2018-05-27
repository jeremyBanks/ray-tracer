import {Vector, V} from 'vector';

// http://iquilezles.org/www/articles/distfunctions/distfunctions.htm

const sdSphere = (origin: Vector, radius: number) => {
    return origin.magnitude() - radius;
};


const imageDataToDataUrl = (imageData: ImageData): string => {
    const canvas = document.createElement('canvas');
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    canvas.getContext('2d')!.putImageData(imageData, 0, 0);
    return canvas.toDataURL();
};


type Color = [number, number, number];


const white: Color = [0xFF, 0xFF, 0xFF];
const black: Color = [0x00, 0x00, 0x00];


const renderPixel = (x: number, y: number): Color => {
    return [
        (x + y) % (x - y),
        (x) % (x - y),
        (y) % (x - y),
    ];
}

const renderFrame = async () => {
    const size = 1024;
    const frame = new ImageData(size, size);

    for (let x = 0; x < frame.width; x++) {
        for (let y = 0; y < frame.width; y++) {
            const pixel = renderPixel(x, y);
            const i = (y * frame.width + x) * 4;
            frame.data[i + 0] = pixel[0];
            frame.data[i + 1] = pixel[1];
            frame.data[i + 2] = pixel[2];
            frame.data[i + 3] = 0xFF;
        }
    }

    return frame;
};


export const main = async () => {
    const output = document.createElement('img');
    output.id = 'output';
    document.body.appendChild(output);


    while (true) {
        const frame = await renderFrame();
        output.src = imageDataToDataUrl(frame);

        await new Promise(resolve => setTimeout(resolve, 16));
        break;
    }
};

main();
