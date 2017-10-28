"use strict";
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
System.register("ray", [], function (exports_2, context_2) {
    "use strict";
    var __moduleName = context_2 && context_2.id;
    var Ray;
    return {
        setters: [],
        execute: function () {
            /** A ray proceeding from a point in a constant direction at one unit distance per one unit time. */
            Ray = class Ray {
                constructor(origin, direction, previousHits = 0) {
                    this.origin = origin;
                    this.direction = direction.direction();
                    this.previousHits = previousHits;
                }
                // The position of the ray at a given time.
                at(t) {
                    return this.origin.add(this.direction.scale(t));
                }
            };
            exports_2("Ray", Ray);
        }
    };
});
System.register("camera", ["vector", "ray"], function (exports_3, context_3) {
    "use strict";
    var __moduleName = context_3 && context_3.id;
    var vector_1, ray_1, Camera;
    return {
        setters: [
            function (vector_1_1) {
                vector_1 = vector_1_1;
            },
            function (ray_1_1) {
                ray_1 = ray_1_1;
            }
        ],
        execute: function () {
            Camera = class Camera {
                constructor() {
                    this.location = vector_1.V(0.0, 0.0, 0.0);
                    this.direction = vector_1.V(0.0, 0.0, 1.0);
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
                getRay(x, y) {
                    if (x < 0 || x > 1)
                        throw new Error(`x is ${x}, out of bounds`);
                    if (y < 0 || y > 1)
                        throw new Error(`y is ${y}, out of bounds`);
                    // This only works for our hard-coded direction V(0, 0, 1).
                    const lensPoint = this.location.add(vector_1.V(-this.halfWidth + x * this.width, -this.halfHeight + y * this.height, 0));
                    return new ray_1.Ray(lensPoint, lensPoint.sub(this.focalPoint));
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
System.register("raytracer", ["color", "vector", "ray", "camera"], function (exports_5, context_5) {
    "use strict";
    var __moduleName = context_5 && context_5.id;
    var color_1, vector_2, ray_2, camera_1, RayTracer, Material, MatteMaterial, ShinyMaterial, Glass, Hit, Scene, Item, Geometry, Sphere;
    return {
        setters: [
            function (color_1_1) {
                color_1 = color_1_1;
            },
            function (vector_2_1) {
                vector_2 = vector_2_1;
            },
            function (ray_2_1) {
                ray_2 = ray_2_1;
            },
            function (camera_1_1) {
                camera_1 = camera_1_1;
            }
        ],
        execute: function () {
            RayTracer = class RayTracer {
                constructor() {
                    this.width = 400;
                    this.height = 300;
                    this.focalPoint = vector_2.V(0, this.height / 2, -256);
                    this.sensorCenter = vector_2.V(0, this.height / 2, 0);
                    this.scene = [
                        new Sphere(vector_2.V(+125, 50, 100), 50, new ShinyMaterial(color_1.Color.GREEN)),
                        new Sphere(vector_2.V(0, 50, 100), 50, new ShinyMaterial(color_1.Color.RED)),
                        new Sphere(vector_2.V(-125, 50, 100), 50, new MatteMaterial(color_1.Color.BLUE)),
                        new Sphere(vector_2.V(0, -1000, 1000), 1000, new MatteMaterial(color_1.Color.BLACK)),
                        new Sphere(vector_2.V(-50, 500, 400), 400, new MatteMaterial(color_1.Color.WHITE)),
                    ];
                    this.maxBounces = 4;
                    this.canvas = document.createElement('canvas');
                    this.canvas.width = this.width;
                    this.canvas.height = this.height;
                    this.context = this.canvas.getContext('2d');
                    this.image = this.context.createImageData(this.width, this.height);
                    this.output = document.createElement('img');
                    this.render();
                }
                async render() {
                    let lastTime = Date.now();
                    for (let y = 0; y < this.height; y++) {
                        const now = Date.now();
                        if (now - lastTime > 250) {
                            this.context.putImageData(this.image, 0, 0);
                            await new Promise(r => setTimeout(r));
                            lastTime = now;
                        }
                        for (let x = 0; x < this.width; x++) {
                            const samplesPerPixel = 8;
                            const colors = [];
                            for (let i = 0; i < samplesPerPixel; i++) {
                                const dx = Math.random() - 0.5;
                                const dy = Math.random() - 0.5;
                                colors.push(this.getSensorColor(x + dx, y + dy));
                            }
                            const pixel = color_1.Color.blend(colors).pow(0.45);
                            const offset = (y * this.width + x) * 4;
                            this.image.data[offset + 0] = pixel.r8;
                            this.image.data[offset + 1] = pixel.g8;
                            this.image.data[offset + 2] = pixel.b8;
                            this.image.data[offset + 3] = 0xFF;
                        }
                    }
                    this.context.putImageData(this.image, 0, 0);
                    const dataUri = this.canvas.toDataURL();
                    this.output.src = dataUri;
                    this.focalPoint = this.focalPoint.add(vector_2.V(1, 1, -64));
                    this.sensorCenter = this.sensorCenter.add(vector_2.V(1, 1, -64));
                }
                getSensorColor(x, y) {
                    const sensorPoint = this.sensorCenter.sub(vector_2.V(-(this.width - 1) / 2 + x, -(this.height - 1) / 2 + y, 0));
                    // a ray projecting out from the sensor, away from the focal point
                    const ray = new ray_2.Ray(sensorPoint, sensorPoint.sub(this.focalPoint).direction());
                    return this.getRayColor(ray);
                }
                getRayColor(ray, background) {
                    if (ray.previousHits >= this.maxBounces)
                        return color_1.Color.BLACK;
                    const hits = [];
                    for (const hittable of this.scene) {
                        hits.push(...hittable.hits(ray));
                    }
                    hits.sort((a, b) => a.t - b.t);
                    if (hits.length > 0) {
                        const hit = hits[0];
                        return hit.subject.material.colorHit(this, hit);
                    }
                    // background, defaulting to a color reflecting the ray's direction.
                    const a = Math.pow(ray.direction.y + 1 / 2, 2);
                    return background || color_1.RGB(a, 0.3 + a, 0.5 + a * 2);
                }
            };
            exports_5("RayTracer", RayTracer);
            /** A material a Hittable can be made of, determining how it's rendered. */
            Material = class Material {
                constructor(color) {
                    this.color = color_1.Color.MAGENTA;
                    this.color = color;
                }
                colorHit(tracer, hit) {
                    return this.color;
                }
            };
            exports_5("Material", Material);
            /** A material that scatters rays, ignoring their incoming angle. */
            MatteMaterial = class MatteMaterial extends Material {
                colorHit(tracer, hit) {
                    const colors = [];
                    const samplesPerBounce = 4;
                    for (let i = 0; i < samplesPerBounce; i++) {
                        colors.push(this.color);
                        colors.push(tracer.getRayColor(new ray_2.Ray(hit.location, hit.normal.add(vector_2.Vector.randomUnit()), hit.ray.previousHits + 1)));
                    }
                    return color_1.Color.blend(colors);
                }
            };
            /** A material that reflects rays. */
            ShinyMaterial = class ShinyMaterial extends Material {
                colorHit(tracer, hit) {
                    const direction = hit.ray.direction;
                    const reflection = direction.sub(hit.normal.scale(2 * direction.dot(hit.normal)));
                    const colors = [];
                    const samplesPerBounce = 4;
                    for (let i = 0; i < samplesPerBounce; i++) {
                        colors.push(this.color);
                        colors.push(tracer.getRayColor(new ray_2.Ray(hit.location, reflection, hit.ray.previousHits + 1)));
                    }
                    return color_1.Color.blend(colors);
                }
            };
            /** A material that refracts rays. */
            Glass = class Glass extends Material {
                colorHit(tracer, hit) {
                    return color_1.Color.RED;
                }
            };
            /** Information about a particular hit of a Ray into a Hittable. */
            Hit = class Hit {
                constructor(ray, subject, t, location, normal) {
                    this.ray = ray;
                    this.subject = subject;
                    this.t = t;
                    this.location = location;
                    this.normal = normal.direction();
                }
            };
            exports_5("Hit", Hit);
            Scene = class Scene {
                constructor(items) {
                    this.camera = new camera_1.Camera();
                    this.items = [...items];
                }
            };
            exports_5("Scene", Scene);
            Item = class Item {
                constructor(geometry, material) {
                    this.geometry = geometry;
                    this.material = material;
                }
            };
            exports_5("Item", Item);
            /** An object our rays can hit. */
            Geometry = class Geometry {
                hit(ray) {
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
            exports_5("Geometry", Geometry);
            Sphere = class Sphere extends Geometry {
                constructor(center, radius, material) {
                    super();
                    this.center = center;
                    this.radius = radius;
                    this.material = material;
                }
                allHits(ray) {
                    const oc = ray.origin.sub(this.center);
                    const a = ray.direction.dot(ray.direction);
                    const b = 2.0 * oc.dot(ray.direction);
                    const c = oc.dot(oc) - this.radius * this.radius;
                    const discriminant = b * b - 4 * a * c;
                    if (discriminant >= 1) {
                        const t1 = (-b + Math.sqrt(discriminant)) / (2 * a);
                        const l1 = ray.at(t1);
                        if (discriminant == 2) {
                            const t2 = (-b - Math.sqrt(discriminant)) / (2 * a);
                            const l2 = ray.at(t2);
                            return [
                                new Hit(ray, this, t1, l1, l1.sub(this.center).direction()),
                                new Hit(ray, this, t2, l2, l2.sub(this.center).direction())
                            ];
                        }
                        else {
                            return [
                                new Hit(ray, this, t1, l1, l1.sub(this.center).direction())
                            ];
                        }
                    }
                    return [];
                }
            };
        }
    };
});
System.register("main", ["raytracer"], function (exports_6, context_6) {
    "use strict";
    var __moduleName = context_6 && context_6.id;
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