System.register("vector", [], function (exports_1, context_1) {
    "use strict";
    var __moduleName = context_1 && context_1.id;
    var V, Vector;
    return {
        setters: [],
        execute: function () {
            /** A vector in number^3 space. */
            exports_1("V", V = (x, y, z) => new Vector(x, y, z));
            Vector = class Vector {
                constructor(x, y, z) {
                    // scalar/absolute magnitude
                    this.magnitudeValue = undefined;
                    // directionally-equivalent unit or zero vector
                    this.directionValue = undefined;
                    if (!Number.isFinite(x))
                        throw new Error(`x is ${x}`);
                    if (!Number.isFinite(y))
                        throw new Error(`y is ${y}`);
                    if (!Number.isFinite(z))
                        throw new Error(`z is ${z}`);
                    this.x = x;
                    this.y = y;
                    this.z = z;
                }
                magnitude() {
                    if (this.magnitudeValue == null) {
                        this.magnitudeValue = Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
                    }
                    return this.magnitudeValue;
                }
                direction() {
                    if (this.directionValue == null) {
                        const magnitude = this.magnitude();
                        if (magnitude === 0 || magnitude === 1) {
                            this.directionValue = this;
                        }
                        else {
                            this.directionValue = this.scale(1 / magnitude);
                            this.directionValue.magnitudeValue = 1;
                            this.directionValue.directionValue = this.directionValue;
                        }
                    }
                    return this.directionValue;
                }
                // negation
                negative() {
                    return new Vector(-this.x, -this.y, -this.z);
                }
                // addition
                add(other) {
                    return new Vector(this.x + other.x, this.y + other.y, this.z + other.z);
                }
                // subtraction
                sub(other) {
                    return new Vector(this.x - other.x, this.y - other.y, this.z - other.z);
                }
                // scale/multiply
                scale(factor) {
                    return new Vector(this.x * factor, this.y * factor, this.z * factor);
                }
                // dot product (scalar product of parallelism :P)
                dot(other) {
                    return this.x * other.x + this.y * other.y + this.z * other.z;
                }
                // cross product (result perpendicular to both operands)
                cross(other) {
                    return new Vector(this.y * other.z - this.z * other.y, -this.x * other.z - this.z * other.x, this.x * other.y - this.y * other.x);
                }
                // a random unit-length vector
                static randomUnit() {
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
            Vector.ZERO = Object.freeze(new Vector(0, 0, 0));
            Vector.X = Object.freeze(new Vector(1, 0, 0));
            Vector.Y = Object.freeze(new Vector(0, 1, 0));
            Vector.Z = Object.freeze(new Vector(0, 0, 1));
            exports_1("Vector", Vector);
            ;
        }
    };
});
System.register("geometry", ["vector"], function (exports_2, context_2) {
    "use strict";
    var __moduleName = context_2 && context_2.id;
    var vector_1, Ray, Hit, Geometry, Sphere;
    return {
        setters: [
            function (vector_1_1) {
                vector_1 = vector_1_1;
            }
        ],
        execute: function () {
            /** A ray proceeding from a point in a constant direction at one unit distance per one unit time. */
            Ray = class Ray {
                constructor(origin, direction) {
                    this.origin = origin;
                    this.direction = direction.direction();
                }
                // The position of the ray at a given time.
                at(t) {
                    // inlined // return this.origin.add(this.direction.scale(t));
                    return new vector_1.Vector(this.origin.x + this.direction.x * t, this.origin.y + this.direction.y * t, this.origin.z + this.direction.z * t);
                }
            };
            exports_2("Ray", Ray);
            /** The location and surface normal of a ray's hit. */
            Hit = class Hit {
                constructor(ray, t, location, normal) {
                    this.ray = ray;
                    this.t = t;
                    this.location = location;
                    this.normal = normal;
                }
            };
            exports_2("Hit", Hit);
            /** An object our rays can hit. */
            Geometry = class Geometry {
                firstHit(ray) {
                    return this.hits(ray)[0] || null;
                }
                // hits on this ray that occur in the future (and so will will be drawn).
                hits(ray) {
                    return this.allHits(ray).filter(hit => hit.t > 0.0001).sort((a, b) => a.t - b.t);
                }
                // all hits on this ray, potentially including ones that occur backwards/in the past
                allHits(ray) {
                    return this.hits(ray);
                }
            };
            exports_2("Geometry", Geometry);
            Sphere = class Sphere extends Geometry {
                constructor(center, radius) {
                    super();
                    this.center = center;
                    this.radius = radius;
                }
                allHits(ray) {
                    const oc = ray.origin.sub(this.center);
                    const a = ray.direction.dot(ray.direction);
                    const b = 2.0 * oc.dot(ray.direction);
                    const c = oc.dot(oc) - this.radius * this.radius;
                    const discriminant = b * b - 4 * a * c;
                    if (discriminant >= 1) {
                        const t1 = (-b - Math.sqrt(discriminant)) / (2 * a);
                        const l1 = ray.at(t1);
                        if (discriminant == 2) {
                            const t2 = (-b + Math.sqrt(discriminant)) / (2 * a);
                            const l2 = ray.at(t2);
                            return [
                                new Hit(ray, t1, l1, l1.sub(this.center).direction()),
                                new Hit(ray, t2, l2, l2.sub(this.center).direction())
                            ];
                        }
                        else {
                            return [
                                new Hit(ray, t1, l1, l1.sub(this.center).direction()),
                            ];
                        }
                    }
                    else {
                        return [];
                    }
                }
            };
            exports_2("Sphere", Sphere);
        }
    };
});
System.register("camera", ["vector", "geometry"], function (exports_3, context_3) {
    "use strict";
    var __moduleName = context_3 && context_3.id;
    var vector_2, geometry_1, Camera;
    return {
        setters: [
            function (vector_2_1) {
                vector_2 = vector_2_1;
            },
            function (geometry_1_1) {
                geometry_1 = geometry_1_1;
            }
        ],
        execute: function () {
            Camera = class Camera {
                constructor() {
                    this.location = vector_2.V(0.0, 0.0, 0.0);
                    this.direction = vector_2.V(0.0, 0.0, 1.0);
                    this.depth = 2.0;
                    this.focalPoint = this.location.sub(this.direction.scale(this.depth));
                    this.width = 1.0;
                    this.height = 1.0;
                    this.halfWidth = this.width / 2.0;
                    this.halfHeight = this.height / 2.0;
                }
                moveTo(location) {
                    // this.location = location;
                    return this;
                }
                lookAt(location) {
                    // this.direction = location.sub(this.location).direction();
                    throw new Error('not implemented');
                }
                // sets the lens depth so that it will obtain this fov given a 1-unit width/height
                setFov(degrees) {
                    throw new Error('not implemented');
                }
                // gets the ray leaving the lens of this camera at fractions x and y of
                // the way across the width and height of the lens.
                // x and y should usually be between 0 and 1, but can be slightly out of that
                // range if you're doing something like sampling.
                getRay(x, y) {
                    // This only works for our hard-coded direction V(0, 0, 1).
                    const lensPoint = this.location.add(vector_2.V(-this.halfWidth + x * this.width, -this.halfHeight + y * this.height, 0));
                    return new geometry_1.Ray(lensPoint, lensPoint.sub(this.focalPoint));
                }
            };
            exports_3("Camera", Camera);
        }
    };
});
System.register("color", [], function (exports_4, context_4) {
    "use strict";
    var __moduleName = context_4 && context_4.id;
    var RGB, Color;
    return {
        setters: [],
        execute: function () {
            /** An RGB number-channel color. */
            exports_4("RGB", RGB = (r, g, b) => new Color(r, g, b));
            Color = class Color {
                constructor(r, g, b) {
                    if (!Number.isFinite(r))
                        throw new Error(`r is ${r}`);
                    if (!Number.isFinite(g))
                        throw new Error(`g is ${g}`);
                    if (!Number.isFinite(b))
                        throw new Error(`b is ${b}`);
                    this.r = Math.min(1.0, Math.max(0.0, r));
                    this.g = Math.min(1.0, Math.max(0.0, g));
                    this.b = Math.min(1.0, Math.max(0.0, b));
                }
                // truncated 8-bit integer values for each channel.
                get r8() { return 0xFF & (this.r * 0xFF); }
                get g8() { return 0xFF & (this.g * 0xFF); }
                get b8() { return 0xFF & (this.b * 0xFF); }
                // raises each channel to the given exponent, such as for gamma transformations.
                pow(exponent) {
                    return new Color(Math.pow(this.r, exponent), Math.pow(this.g, exponent), Math.pow(this.b, exponent));
                }
                // Blends an array of colors, each optionally with an associated weight.
                static blend(colors) {
                    if (colors.length == 0) {
                        throw new Error("can't blend array of 0 colors");
                    }
                    let r = 0, g = 0, b = 0, max = 0;
                    for (const c of colors) {
                        let weight;
                        let color;
                        if (c instanceof Color) {
                            weight = 1;
                            color = c;
                        }
                        else {
                            [weight, color] = c;
                        }
                        r += weight * color.r;
                        g += weight * color.g;
                        b += weight * color.b;
                        max += weight;
                    }
                    return new Color(r / max, g / max, b / max);
                }
            };
            Color.BLACK = Object.freeze(new Color(0, 0, 0));
            Color.BLUE = Object.freeze(new Color(0, 0, 1));
            Color.GREEN = Object.freeze(new Color(0, 1, 0));
            Color.CYAN = Object.freeze(new Color(0, 1, 1));
            Color.RED = Object.freeze(new Color(1, 0, 0));
            Color.MAGENTA = Object.freeze(new Color(1, 0, 1));
            Color.YELLOW = Object.freeze(new Color(1, 1, 0));
            Color.WHITE = Object.freeze(new Color(1, 1, 1));
            exports_4("Color", Color);
        }
    };
});
System.register("util", [], function (exports_5, context_5) {
    "use strict";
    var __moduleName = context_5 && context_5.id;
    var randomChoice;
    return {
        setters: [],
        execute: function () {
            exports_5("randomChoice", randomChoice = (choices) => {
                const i = Math.floor(Math.random() * choices.length);
                return choices[i];
            });
        }
    };
});
System.register("settings", [], function (exports_6, context_6) {
    "use strict";
    var __moduleName = context_6 && context_6.id;
    var samplesPerPixel, maxBounces, maxSamplesPerBounce;
    return {
        setters: [],
        execute: function () {
            exports_6("samplesPerPixel", samplesPerPixel = 32);
            exports_6("maxBounces", maxBounces = 16);
            exports_6("maxSamplesPerBounce", maxSamplesPerBounce = 8);
        }
    };
});
System.register("raytracer", ["color", "vector", "geometry", "camera", "util", "settings"], function (exports_7, context_7) {
    "use strict";
    var __moduleName = context_7 && context_7.id;
    var color_1, vector_3, geometry_2, camera_1, util_1, settings, RayTracer, Material, MatteMaterial, ShinyMaterial, GlassMaterial, RayHit, Scene, Item;
    return {
        setters: [
            function (color_1_1) {
                color_1 = color_1_1;
            },
            function (vector_3_1) {
                vector_3 = vector_3_1;
            },
            function (geometry_2_1) {
                geometry_2 = geometry_2_1;
            },
            function (camera_1_1) {
                camera_1 = camera_1_1;
            },
            function (util_1_1) {
                util_1 = util_1_1;
            },
            function (settings_1) {
                settings = settings_1;
            }
        ],
        execute: function () {
            RayTracer = class RayTracer {
                constructor() {
                    this.width = 400;
                    this.height = 300;
                    this.scene = new Scene();
                    this.canvas = document.createElement('canvas');
                    this.canvas.width = this.width;
                    this.canvas.height = this.height;
                    this.context = this.canvas.getContext('2d');
                    this.image = this.context.createImageData(this.width, this.height);
                    this.output = document.createElement('img');
                }
                async render() {
                    let lastTime = Date.now();
                    const size = Math.max(this.width, this.height);
                    const chunkSize = Math.floor(size / 32);
                    // how much we pad inside the potential camera frame on each side to match the target aspect ratio
                    const xPadding = (size - this.width) / 2;
                    const yPadding = (size - this.height) / 2;
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
                                    const colors = [];
                                    for (let i = 0; i < settings.samplesPerPixel; i++) {
                                        const dx = Math.random() - 0.5;
                                        const dy = Math.random() - 0.5;
                                        colors.push(this.getRayColor(this.scene.camera.getRay((xPadding + x + dx) / (size - 1), (yPadding + y + dy) / (size - 1))));
                                    }
                                    const pixel = color_1.Color.blend(colors); //.pow(0.45);
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
                getRayColor(ray, previousHit) {
                    if ((previousHit ? previousHit.previousHits : 0) + 1 >= settings.maxBounces) {
                        return color_1.Color.BLACK;
                    }
                    let closestHit;
                    let closestHitItem;
                    for (const item of this.scene.items) {
                        const hit = item.geometry.firstHit(ray);
                        if (hit && (!closestHit || hit.t < closestHit.t)) {
                            closestHit = hit;
                            closestHitItem = item;
                        }
                    }
                    if (closestHit && closestHitItem) {
                        const rayHit = new RayHit(closestHit, closestHitItem, previousHit);
                        return closestHitItem.material.hitColor(this, rayHit);
                    }
                    // background, a light color reflecting the ray's direction.
                    const a = Math.pow(ray.direction.y + 1 / 2, 2);
                    return color_1.RGB(a, 0.3 + a, 0.5 + a * 2);
                }
            };
            exports_7("RayTracer", RayTracer);
            /** A material a Hittable can be made of, determining how it's rendered. */
            Material = class Material {
                constructor(color) {
                    this.color = color_1.Color.MAGENTA;
                    this.color = color;
                }
                hitColor(tracer, rayHit) {
                    return this.color;
                }
            };
            exports_7("Material", Material);
            /** A material that scatters rays, ignoring their incoming angle. */
            MatteMaterial = class MatteMaterial extends Material {
                constructor() {
                    super(...arguments);
                    this.fuzz = 0.5 + 0.5 * Math.random();
                }
                hitColor(tracer, rayHit) {
                    const colors = [];
                    const samplesPerBounce = Math.ceil(settings.maxSamplesPerBounce / (rayHit.previousHits + 1));
                    for (let i = 0; i < samplesPerBounce; i++) {
                        colors.push([1, this.color]);
                        const scatteredRay = new geometry_2.Ray(rayHit.hit.location, rayHit.hit.normal.add(vector_3.Vector.randomUnit().scale(this.fuzz)).direction());
                        colors.push([1, tracer.getRayColor(scatteredRay, rayHit)]);
                    }
                    return color_1.Color.blend(colors);
                }
            };
            /** A material that reflects rays. */
            ShinyMaterial = class ShinyMaterial extends Material {
                constructor() {
                    super(...arguments);
                    this.fuzz = Math.random();
                }
                hitColor(tracer, rayHit) {
                    const direction = rayHit.hit.ray.direction;
                    const reflection = direction.sub(rayHit.hit.normal.scale(2 * direction.dot(rayHit.hit.normal))).direction();
                    const colors = [];
                    const samplesPerBounce = Math.ceil(settings.maxSamplesPerBounce / (rayHit.previousHits + 1));
                    for (let i = 0; i < samplesPerBounce; i++) {
                        colors.push([1, this.color]);
                        const reflectedRay = new geometry_2.Ray(rayHit.hit.location, reflection.add(vector_3.Vector.randomUnit().scale(this.fuzz)).direction());
                        colors.push([2, tracer.getRayColor(reflectedRay, rayHit)]);
                    }
                    return color_1.Color.blend(colors);
                }
            };
            /** A material that refracts rays. */
            GlassMaterial = class GlassMaterial extends Material {
                hitColor(tracer, rayHit) {
                    return color_1.Color.RED;
                }
            };
            /** All of the information about a hit and its ray. */
            RayHit = class RayHit {
                constructor(hit, subject, previousHit) {
                    this.hit = hit;
                    this.subject = subject;
                    this.previousHit = previousHit || null;
                    this.previousHits = previousHit ? previousHit.previousHits + 1 : 0;
                }
            };
            exports_7("RayHit", RayHit);
            Scene = class Scene {
                constructor() {
                    this.items = [
                        new Item(new geometry_2.Sphere(vector_3.V(-50, 500, 1400), 400), new MatteMaterial(color_1.Color.YELLOW)),
                    ];
                    this.camera = new camera_1.Camera();
                    for (let i = 0; i < 12; i++) {
                        const geometry = new geometry_2.Sphere(vector_3.V(-200 + (i % 4) * 120, 50 - 130 * Math.floor(i / 4), 1100), 50);
                        const color = util_1.randomChoice([color_1.Color.RED, color_1.Color.BLUE, color_1.Color.GREEN, color_1.Color.CYAN, color_1.Color.MAGENTA, color_1.Color.YELLOW]);
                        const material = new (util_1.randomChoice([ShinyMaterial, MatteMaterial]))(color);
                        this.items.push(new Item(geometry, material));
                    }
                }
            };
            exports_7("Scene", Scene);
            Item = class Item {
                constructor(geometry, material) {
                    this.geometry = geometry;
                    this.material = material;
                }
                toString() {
                    return `${this.material} ${this.geometry}`;
                }
            };
            exports_7("Item", Item);
        }
    };
});
System.register("main", ["raytracer"], function (exports_8, context_8) {
    "use strict";
    var __moduleName = context_8 && context_8.id;
    var raytracer_1, main;
    return {
        setters: [
            function (raytracer_1_1) {
                raytracer_1 = raytracer_1_1;
            }
        ],
        execute: function () {
            main = () => {
                const tracer = new raytracer_1.RayTracer();
                document.body.appendChild(tracer.output);
                document.body.appendChild(tracer.canvas);
                tracer.render();
            };
            main();
        }
    };
});
//# sourceMappingURL=all.js.map