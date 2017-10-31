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
                        console.warn(`x is ${x}`);
                    if (!Number.isFinite(y))
                        console.warn(`y is ${y}`);
                    if (!Number.isFinite(z))
                        console.warn(`z is ${z}`);
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
                    return new Vector(this.y * other.z - this.z * other.y, this.z * other.x - this.x * other.z, this.x * other.y - this.y * other.x);
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
            Vector.ZERO = new Vector(0, 0, 0);
            Vector.X = new Vector(1, 0, 0);
            Vector.Y = new Vector(0, 1, 0);
            Vector.Z = new Vector(0, 0, 1);
            exports_1("Vector", Vector);
            ;
        }
    };
});
System.register("geometry", ["vector"], function (exports_2, context_2) {
    "use strict";
    var __moduleName = context_2 && context_2.id;
    var vector_1, epsilon, Ray, Hit, Geometry, Sphere, Plane;
    return {
        setters: [
            function (vector_1_1) {
                vector_1 = vector_1_1;
            }
        ],
        execute: function () {
            // fudge factor for floating point inaccuracy
            epsilon = 0.00001;
            /** A ray proceeding from a point in a constant direction at one unit distance per one unit time. */
            Ray = class Ray {
                constructor(origin, direction) {
                    this.origin = origin;
                    this.direction = direction.direction();
                }
                // The position of the ray at a given time.
                at(t) {
                    return new vector_1.Vector(this.origin.x + this.direction.x * t, this.origin.y + this.direction.y * t, this.origin.z + this.direction.z * t);
                    // inlined: this.origin.add(this.direction.scale(t));
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
                constructor(position, radius = Infinity) {
                    this.position = position;
                    this.radius = radius;
                }
                // Returns a number providing a lower bound for t when this object could first be hit,
                // or null if we can already cheaply tell that it won't be hit.
                // this just uses the bounding radius and position.
                firstPossibleHitT(ray) {
                    const dX = this.position.x - ray.origin.x;
                    const dY = this.position.y - ray.origin.y;
                    const dZ = this.position.z - ray.origin.z;
                    const vX = ray.direction.x;
                    const vY = ray.direction.y;
                    const vZ = ray.direction.z;
                    const rebasedT = dX * vX + dY * vY + dZ * vZ;
                    const minT = rebasedT - this.radius;
                    const maxT = rebasedT + this.radius;
                    if (maxT < 0) {
                        return null;
                    }
                    const yXP = -vZ * -vX;
                    const yYP = vZ * vY;
                    const yZP = vX * -vX - vY * vY;
                    const yM = Math.sqrt(yXP * yXP + yYP * yYP + yZP * yZP);
                    const yX = yXP / yM;
                    const yY = yYP / yM;
                    const yZ = yZP / yM;
                    const x = dX * vY + dY * -vX;
                    const y = dX * yX + dY * yY + dZ * yZ;
                    if (Math.sqrt(x * x + y * y) > this.radius) {
                        return null;
                    }
                    return minT;
                }
                firstHit(ray) {
                    let first = null;
                    for (const hit of this.allHits(ray)) {
                        if (hit.t > epsilon && (!first || hit.t < first.t)) {
                            first = hit;
                        }
                    }
                    return first;
                }
                // all hits on this ray, optionally including ones that occur backwards/in the past
                allHits(ray) {
                    const hit = this.firstHit(ray);
                    return hit ? [hit] : [];
                }
            };
            exports_2("Geometry", Geometry);
            Sphere = class Sphere extends Geometry {
                allHits(ray) {
                    const pX = this.position.x;
                    const pY = this.position.y;
                    const pZ = this.position.z;
                    const oX = ray.origin.x;
                    const oY = ray.origin.y;
                    const oZ = ray.origin.z;
                    const vX = ray.direction.x;
                    const vY = ray.direction.y;
                    const vZ = ray.direction.z;
                    const dX = oX - pX;
                    const dY = oY - pY;
                    const dZ = oZ - pZ;
                    const a = (vX * vX + vY * vY + vZ * vZ);
                    const b = 2.0 * (dX * vX + dY * vY + dZ * vZ);
                    const c = (dX * dX + dY * dY + dZ * dZ) - this.radius * this.radius;
                    const discriminant = b * b - 4 * a * c;
                    if (discriminant >= 1) {
                        const t1 = (-b - Math.sqrt(discriminant)) / (2 * a);
                        const l1 = vector_1.V(oX + vX * t1, oY + vY * t1, oZ + vZ * t1);
                        if (discriminant == 2) {
                            const t2 = (-b + Math.sqrt(discriminant)) / (2 * a);
                            const l2 = vector_1.V(oX + vX * t2, oY + vY * t2, oZ + vZ * t2);
                            return [
                                new Hit(ray, t1, l1, vector_1.V(l1.x - pX, l1.y - pY, l1.z - pZ).direction()),
                                new Hit(ray, t2, l2, vector_1.V(l2.x - pX, l2.y - pY, l2.z - pZ).direction()),
                            ];
                        }
                        else {
                            return [
                                new Hit(ray, t1, l1, vector_1.V(l1.x - pX, l1.y - pY, l1.z - pZ).direction()),
                            ];
                        }
                    }
                    else {
                        return [];
                    }
                }
            };
            exports_2("Sphere", Sphere);
            Plane = class Plane extends Geometry {
                constructor(origin, normal) {
                    super(origin, Infinity);
                    this.normal = normal;
                }
                allHits(ray) {
                    const dot = ray.direction.dot(this.normal);
                    if (Math.abs(dot) > epsilon) {
                        const origin = ray.origin.sub(this.position);
                        const t = this.normal.dot(origin) / -dot;
                        return [new Hit(ray, t, ray.at(t), this.normal)];
                    }
                    return [];
                }
            };
            exports_2("Plane", Plane);
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
                    const lensPoint = this.location.add(vector_2.V(this.halfWidth - x * this.width, this.halfHeight - y * this.height, 0));
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
            exports_4("RGB", RGB = (r, g = r, b = (r + g) / 2) => new Color(r, g, b));
            Color = class Color {
                constructor(r, g, b) {
                    if (!Number.isFinite(r))
                        console.warn(`r is ${r}`);
                    if (!Number.isFinite(g))
                        console.warn(`g is ${g}`);
                    if (!Number.isFinite(b))
                        console.warn(`b is ${b}`);
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
                // linerally an array of colors, each optionally with an associated weight.
                static blend(...colors) {
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
                static multiply(...colors) {
                    let [r, g, b] = [1, 1, 1];
                    for (const c of colors) {
                        r = r * c.r;
                        g = g * c.g;
                        b = b * c.b;
                    }
                    return new Color(r, g, b);
                }
                static screen(...colors) {
                    let [r, g, b] = [0, 0, 0];
                    for (const c of colors) {
                        r = (1 - r) * (1 - c.r);
                        g = (1 - g) * (1 - c.g);
                        b = (1 - b) * (1 - c.b);
                    }
                    return new Color(r, g, b);
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
System.register("material", ["vector", "color"], function (exports_6, context_6) {
    "use strict";
    var __moduleName = context_6 && context_6.id;
    var vector_3, color_1, Material, MatteMaterial, ShinyMaterial, GlassMaterial, Light;
    return {
        setters: [
            function (vector_3_1) {
                vector_3 = vector_3_1;
            },
            function (color_1_1) {
                color_1 = color_1_1;
            }
        ],
        execute: function () {
            /** A material a Hittable can be made of, determining how it's rendered. */
            Material = class Material {
                constructor(color = color_1.Color.MAGENTA, colorStrength = 1.0, fuzziness = 0.0) {
                    this.colorMode = 'absorb';
                    this.color = color;
                    this.colorStrength = Math.max(0, Math.min(1, colorStrength));
                    this.fuzziness = Math.max(0, Math.min(1, fuzziness));
                }
                /**
                 * generate a possible angle of reflection.
                 * this can produce randomized results; it will be called multiple times.
                 * if possible the random element should be scaled by fuzziness, down to
                 * a non-random behaviour at 0.0.
                 */
                getDeflection(hit) {
                    return this.fuzzDirection(hit.ray.direction);
                }
                fuzzDirection(direction) {
                    return direction.direction().add(vector_3.Vector.randomUnit().scale(this.fuzziness)).direction();
                }
            };
            exports_6("Material", Material);
            /** A material that scatters rays, ignoring their incoming angle. */
            MatteMaterial = class MatteMaterial extends Material {
                getDeflection(hit) {
                    return this.fuzzDirection(hit.normal);
                }
            };
            MatteMaterial.PURE_FUZZ = new MatteMaterial(color_1.Color.MAGENTA, 0.0, 1.0);
            MatteMaterial.PURE_PROJECTION = new MatteMaterial(color_1.Color.MAGENTA, 0.0, 0.0);
            exports_6("MatteMaterial", MatteMaterial);
            /** A material that reflects rays. */
            ShinyMaterial = class ShinyMaterial extends Material {
                constructor() {
                    super(...arguments);
                    this.fuzz = Math.pow(Math.random(), 2);
                }
                getDeflection(hit) {
                    const reflection = hit.ray.direction.sub(hit.normal.scale(2 * hit.ray.direction.dot(hit.normal))).direction();
                    return this.fuzzDirection(reflection);
                }
            };
            ShinyMaterial.PURE_FUZZ = new MatteMaterial(color_1.Color.MAGENTA, 0.0, 1.0);
            ShinyMaterial.PURE_REFLECTION = new MatteMaterial(color_1.Color.MAGENTA, 0.0, 0.0);
            exports_6("ShinyMaterial", ShinyMaterial);
            /** A material that refracts rays. */
            GlassMaterial = class GlassMaterial extends Material {
                constructor() {
                    super(...arguments);
                    this.color = color_1.Color.RED;
                }
            };
            exports_6("GlassMaterial", GlassMaterial);
            /** A light that emits light and also lets rays pass through */
            Light = class Light extends Material {
                constructor(color) {
                    super(color, 1.0);
                    this.colorMode = 'emit';
                }
            };
            exports_6("Light", Light);
        }
    };
});
System.register("voxel", ["vector", "geometry"], function (exports_7, context_7) {
    "use strict";
    var __moduleName = context_7 && context_7.id;
    var vector_4, geometry_2, VoxelGeometry, MaskedGeometry;
    return {
        setters: [
            function (vector_4_1) {
                vector_4 = vector_4_1;
            },
            function (geometry_2_1) {
                geometry_2 = geometry_2_1;
            }
        ],
        execute: function () {
            VoxelGeometry = class VoxelGeometry extends geometry_2.Geometry {
            };
            exports_7("VoxelGeometry", VoxelGeometry);
            MaskedGeometry = class MaskedGeometry extends VoxelGeometry {
                constructor(position) {
                    super(position);
                    this.voxelDistance = 32;
                    this.voxelRadius = 26;
                    this.front = [
                        [, , , , , , , ,],
                        [, , , 1, 1, , , ,],
                        [, , 1, , , 1, , ,],
                        [, 1, 1, 1, 1, 1, 1, ,],
                        [1, , , , , , , 1,],
                        [, 1, , , , , 1, ,],
                        [1, 1, 1, , , 1, 1, 1,],
                        [, , , , , , , ,],
                    ];
                    this.top = [
                        [1, 1, 1, 1, 1, 1, 1, 1,],
                        [1, 1, 1, 1, 1, 1, 1, 1,],
                        [1, 1, 1, 1, 1, 1, 1, 1,],
                        [1, 1, 1, 1, 1, 1, 1, 1,],
                        [1, 1, 1, 1, 1, 1, 1, 1,],
                        [1, 1, 1, 1, 1, 1, 1, 1,],
                        [1, 1, 1, 1, 1, 1, 1, 1,],
                        [1, 1, 1, 1, 1, 1, 1, 1,],
                    ];
                    this.side = [
                        [, , , , , , , ,],
                        [, , , , , , 1, ,],
                        [, , , , , 1, 1, ,],
                        [, , , , 1, 1, 1, ,],
                        [, , , 1, 1, 1, 1, ,],
                        [, , 1, 1, 1, 1, 1, ,],
                        [, 1, 1, 1, 1, 1, 1, ,],
                        [, , , , , , , ,],
                    ];
                    this.pixelSize = 8;
                    this.pixelWidth = this.pixelSize;
                    this.pixelHeight = this.pixelSize;
                    this.pixelDepth = this.pixelSize;
                    this.radius = Infinity;
                    this.voxelGeometries = [];
                    for (let x = 0; x < this.pixelWidth; x++) {
                        for (let y = 0; y < this.pixelHeight; y++) {
                            for (let z = 0; z < this.pixelDepth; z++) {
                                const yI = this.pixelHeight - 1 - y;
                                const xI = x;
                                const zI = z;
                                if (this.front[yI][xI] && this.side[yI][zI] && this.top[zI][xI]) {
                                    this.voxelGeometries.push(new geometry_2.Sphere(this.position.add(vector_4.V(x * this.voxelDistance, y * this.voxelDistance, z * this.voxelDistance)), this.voxelRadius));
                                }
                            }
                        }
                    }
                }
                allHits(ray) {
                    return this.voxelGeometries.map(geo => geo.firstHit(ray)).filter(Boolean);
                }
                firstPossibleHitT(ray) {
                    // if (super.firstPossibleHitT(ray) == null) return null;
                    let closestHit = null;
                    for (const geo of this.voxelGeometries) {
                        const h = geo.firstPossibleHitT(ray);
                        if (h !== null && (closestHit === null || h < closestHit)) {
                            closestHit = h;
                        }
                    }
                    return closestHit;
                }
            };
            exports_7("MaskedGeometry", MaskedGeometry);
        }
    };
});
System.register("scene", ["camera", "color", "vector", "material", "geometry", "voxel"], function (exports_8, context_8) {
    "use strict";
    var __moduleName = context_8 && context_8.id;
    var camera_1, color_2, vector_5, material_1, geometry_3, voxel_1, Scene, Item;
    return {
        setters: [
            function (camera_1_1) {
                camera_1 = camera_1_1;
            },
            function (color_2_1) {
                color_2 = color_2_1;
            },
            function (vector_5_1) {
                vector_5 = vector_5_1;
            },
            function (material_1_1) {
                material_1 = material_1_1;
            },
            function (geometry_3_1) {
                geometry_3 = geometry_3_1;
            },
            function (voxel_1_1) {
                voxel_1 = voxel_1_1;
            }
        ],
        execute: function () {
            Scene = class Scene {
                constructor() {
                    this.items = [];
                    this.camera = new camera_1.Camera();
                    const sun = new Item(new geometry_3.Sphere(vector_5.V(5000, 15000, 0), 10000), new material_1.Light(color_2.RGB(1.0, 1.0, 1.0)));
                    this.items.push(sun);
                    const miniSuns = [
                        new Item(new geometry_3.Sphere(vector_5.V(0, -500, -250), 500), new material_1.Light(color_2.RGB(1, 0, 0))),
                        new Item(new geometry_3.Sphere(vector_5.V(500, -500, -250), 500), new material_1.Light(color_2.RGB(0, 1, 0))),
                        new Item(new geometry_3.Sphere(vector_5.V(-500, -500, -250), 500), new material_1.Light(color_2.RGB(0, 0, 1))),
                    ];
                    this.items.push(sun, ...miniSuns);
                    const logo = new voxel_1.MaskedGeometry(vector_5.V(-100, -100, 750));
                    for (const geo of logo.voxelGeometries) {
                        this.items.push(new Item(geo, new material_1.MatteMaterial(color_2.RGB(1), 1.0, 1.9)));
                    }
                }
            };
            exports_8("Scene", Scene);
            Item = class Item {
                constructor(geometry, material) {
                    this.geometry = geometry;
                    this.material = material;
                }
                toString() {
                    return `${this.material} ${this.geometry}`;
                }
            };
            exports_8("Item", Item);
        }
    };
});
System.register("raytracer", ["color", "geometry"], function (exports_9, context_9) {
    "use strict";
    var __moduleName = context_9 && context_9.id;
    var color_3, geometry_4, RayTracer, TracedHit;
    return {
        setters: [
            function (color_3_1) {
                color_3 = color_3_1;
            },
            function (geometry_4_1) {
                geometry_4 = geometry_4_1;
            }
        ],
        execute: function () {
            RayTracer = class RayTracer {
                constructor(scene) {
                    this.maxSamplesPerBounce = 8;
                    this.maxBounces = 8;
                    this.skyColor = color_3.Color.BLACK;
                    this.scene = scene;
                }
                getRayColor(ray, previousHit) {
                    if ((previousHit ? previousHit.previousCount : 0) + 1 >= this.maxBounces) {
                        return color_3.Color.BLACK;
                    }
                    const itemsByMinDistance = this.scene.items.map(item => {
                        // the minimum possible t at which this object could be encountered.
                        // may be negative the ray's origin is within those bounds,
                        // or negative infinity if the item has no bounds.
                        let minDistance = item.geometry.firstPossibleHitT(ray);
                        return { item, minDistance };
                    }).filter(({ minDistance }) => minDistance != null).sort((a, b) => a.minDistance - b.minDistance);
                    let closestHit;
                    let closestHitItem;
                    for (const { item, minDistance } of itemsByMinDistance) {
                        if (closestHit && minDistance >= closestHit.t) {
                            // we're looking at objects that will only appear behind
                            // the hit we already have.
                            break;
                        }
                        const hit = item.geometry.firstHit(ray);
                        if (hit && (!closestHit || hit.t < closestHit.t)) {
                            closestHit = hit;
                            closestHitItem = item;
                        }
                    }
                    if (closestHit && closestHitItem) {
                        const tracedHit = new TracedHit(closestHit, closestHitItem, previousHit);
                        const material = closestHitItem.material;
                        // halve samples after each bounce, down to minimum of 1.
                        const samplesPerBounce = Math.ceil(this.maxSamplesPerBounce / Math.pow(2, tracedHit.previousCount));
                        const samples = [];
                        for (let i = 0; i < samplesPerBounce; i++) {
                            const deflection = new geometry_4.Ray(closestHit.location, material.getDeflection(closestHit));
                            const color = this.getRayColor(deflection, tracedHit);
                            samples.push(color);
                        }
                        const deflectedColor = color_3.Color.blend(...samples);
                        if (material.colorMode == 'absorb') {
                            const blendColor = color_3.Color.blend([material.colorStrength, material.color], [1 - material.colorStrength, color_3.Color.WHITE]);
                            return color_3.Color.multiply(blendColor, deflectedColor);
                        }
                        else {
                            const blendColor = color_3.Color.blend([material.colorStrength, material.color], [1 - material.colorStrength, color_3.Color.BLACK]);
                            return color_3.Color.screen(blendColor, deflectedColor);
                        }
                    }
                    return this.skyColor;
                }
            };
            exports_9("RayTracer", RayTracer);
            /** All of the information about a hit and its ray. */
            TracedHit = class TracedHit {
                constructor(hit, subject, previousHit) {
                    this.hit = hit;
                    this.subject = subject;
                    this.previous = previousHit || null;
                    this.previousCount = previousHit ? previousHit.previousCount + 1 : 0;
                }
            };
            exports_9("TracedHit", TracedHit);
        }
    };
});
System.register("canvasrenderer", ["color"], function (exports_10, context_10) {
    "use strict";
    var __moduleName = context_10 && context_10.id;
    var color_4, CanvasRenderer;
    return {
        setters: [
            function (color_4_1) {
                color_4 = color_4_1;
            }
        ],
        execute: function () {
            CanvasRenderer = class CanvasRenderer {
                constructor(width = 256, height = width) {
                    this.samplesPerPixel = Infinity;
                    this.intraSampleDelay = 0;
                    this.gammaPower = 0.45;
                    this.width = width;
                    this.height = height;
                    this.canvas = document.createElement('canvas');
                    this.canvas.width = this.width;
                    this.canvas.height = this.height;
                    this.context = this.canvas.getContext('2d');
                    this.image = this.context.createImageData(this.width, this.height);
                    this.output = document.createElement('img');
                    this.output.width = this.width;
                    this.output.height = this.height;
                    this.debugger = document.createElement('pre');
                    this.debugger.classList.add('debugger');
                }
                async render(rayTracer) {
                    let lastTime = Date.now();
                    const size = Math.max(this.width, this.height);
                    const chunkSize = Math.floor(size / 16);
                    // how much we pad inside the potential camera frame on each side to match the target aspect ratio
                    const xPadding = (size - this.width) / 2;
                    const yPadding = (size - this.height) / 2;
                    this.context.clearRect(0, 0, this.width, this.height);
                    this.output.src = this.canvas.toDataURL();
                    const pixels = [];
                    for (let y = 0; y < this.width; y++) {
                        const row = [];
                        for (let x = 0; x < this.width; x++) {
                            row.push({ samples: [], deviation: 1 });
                        }
                        pixels.push(row);
                    }
                    let lastPassStartTime = 0;
                    const passDurations = [];
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
                                    const cursor = color_4.Color.RED;
                                    for (let x = xOffset; x < this.width && x < xOffset + chunkSize; x++) {
                                        for (let y = yOffset; y < this.height && y < yOffset + chunkSize; y++) {
                                            const offset = (y * this.width + x) * 4;
                                            this.image.data[offset + 0] = 0xFF - (this.image.data[offset + 0] / 2) | 0;
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
                                        pixels[y][x].samples.push(rayTracer.getRayColor(rayTracer.scene.camera.getRay((xPadding + x + dx) / (size - 1), (yPadding + y + dy) / (size - 1))));
                                        const pixel = color_4.Color.blend(...pixels[y][x].samples).pow(this.gammaPower);
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
            };
            exports_10("CanvasRenderer", CanvasRenderer);
        }
    };
});
System.register("main", ["raytracer", "scene", "canvasrenderer"], function (exports_11, context_11) {
    "use strict";
    var __moduleName = context_11 && context_11.id;
    var raytracer_1, scene_1, canvasrenderer_1, main;
    return {
        setters: [
            function (raytracer_1_1) {
                raytracer_1 = raytracer_1_1;
            },
            function (scene_1_1) {
                scene_1 = scene_1_1;
            },
            function (canvasrenderer_1_1) {
                canvasrenderer_1 = canvasrenderer_1_1;
            }
        ],
        execute: function () {
            main = () => {
                const scene = new scene_1.Scene();
                const rayTracer = new raytracer_1.RayTracer(scene);
                const renderer = new canvasrenderer_1.CanvasRenderer(600, 400);
                document.body.appendChild(renderer.output);
                document.body.appendChild(renderer.canvas);
                document.body.appendChild(renderer.debugger);
                renderer.render(rayTracer);
            };
            main();
        }
    };
});
//# sourceMappingURL=all.js.map