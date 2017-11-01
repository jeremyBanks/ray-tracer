import {RayTracer} from 'raytracer';
import {Scene} from 'scene';
import {CanvasRenderer} from 'canvasrenderer';


const main = () => {
    const scene = new Scene();
    const rayTracer = new RayTracer(scene);
    const renderer = new CanvasRenderer(256, 256);

    const output = document.querySelector('#output') || document.body;
    output.appendChild(renderer.output);

    const state = document.querySelector('#state') || document.body;
    state.appendChild(renderer.canvas);
    state.appendChild(renderer.debugger);

    renderer.render(rayTracer);
};

main();
