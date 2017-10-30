import {RayTracer} from 'raytracer';
import {Scene} from 'scene';
import {CanvasRenderer} from 'canvasrenderer';


const main = () => {
    const scene = new Scene();
    const rayTracer = new RayTracer(scene);
    const renderer = new CanvasRenderer(600, 400);
    
    document.body.appendChild(renderer.output); 
    document.body.appendChild(renderer.canvas);
    document.body.appendChild(renderer.debugger);

    renderer.render(rayTracer);
};

main();
