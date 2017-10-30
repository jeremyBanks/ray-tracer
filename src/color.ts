/** An RGB number-channel color. */
export const RGB = (r: number, g: number = r, b: number = (r + g) / 2) => new Color(r, g, b);
export class Color {
    static BLACK   = Object.freeze(new Color(0, 0, 0));
    static BLUE    = Object.freeze(new Color(0, 0, 1));
    static GREEN   = Object.freeze(new Color(0, 1, 0));
    static CYAN    = Object.freeze(new Color(0, 1, 1));
    static RED     = Object.freeze(new Color(1, 0, 0));
    static MAGENTA = Object.freeze(new Color(1, 0, 1));
    static YELLOW  = Object.freeze(new Color(1, 1, 0));
    static WHITE   = Object.freeze(new Color(1, 1, 1));

    // each channel is a float between 0.0 and 1.0.
    readonly r: number;
    readonly g: number;
    readonly b: number;

    constructor(r: number, g: number, b: number) {
        if (!Number.isFinite(r)) console.warn(`r is ${r}`);
        if (!Number.isFinite(g)) console.warn(`g is ${g}`);
        if (!Number.isFinite(b)) console.warn(`b is ${b}`);

        this.r = Math.min(1.0, Math.max(0.0, r));
        this.g = Math.min(1.0, Math.max(0.0, g));
        this.b = Math.min(1.0, Math.max(0.0, b));
    }
    
    // truncated 8-bit integer values for each channel.
    get r8() { return 0xFF & (this.r * 0xFF); }
    get g8() { return 0xFF & (this.g * 0xFF); }
    get b8() { return 0xFF & (this.b * 0xFF); }

    // raises each channel to the given exponent, such as for gamma transformations.
    pow(exponent: number) {
        return new Color(
            Math.pow(this.r, exponent),
            Math.pow(this.g, exponent),
            Math.pow(this.b, exponent));
    }

    // linerally an array of colors, each optionally with an associated weight.
    static blend(...colors: (Color | [number, Color])[]) {
        if (colors.length == 0) {
            throw new Error("can't blend array of 0 colors");
        }

        let r = 0, g = 0, b = 0, max = 0;
        for (const c of colors) {
            let weight: number;
            let color: Color;
            if (c instanceof Color) {
                weight = 1;
                color = c;
            } else {
                [weight, color] = c;
            }
            r += weight * color.r;
            g += weight * color.g;
            b += weight * color.b;
            max += weight;
        }
        return new Color(r / max, g / max, b / max);
    }

    static multiply(...colors: Color[]) {
        let [r, g, b] = [1, 1, 1];
        for (const c of colors) {
            r = r * c.r;
            g = g * c.g;
            b = b * c.b;
        }
        return new Color(r, g, b);

    }

    static screen(...colors: Color[]) {
        let [r, g, b] = [0, 0, 0];
        for (const c of colors) {
            r = (1 - r) * (1 - c.r);
            g = (1 - g) * (1 - c.g);
            b = (1 - b) * (1 - c.b);
        }
        return new Color(r, g, b);
    }
}
