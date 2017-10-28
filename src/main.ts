import {RayTracer} from './raytracer';


const main = () => {
    const tracer = new RayTracer();
    document.body.appendChild(tracer.output); 
    document.body.appendChild(tracer.canvas);
    tracer.render();
};

main();
