/** An RGB number-channel color. */
export const RGB = (r: number, g: number, b: number) => new Color(r, g, b);
export class Color {
    static BLACK = new Color(0.0, 0.0, 0.0);
    static WHITE = new Color(1.0, 1.0, 1.0);
    static MAGENTA = new Color(1.0, 0.0, 1.0);
    static RED = new Color(1.0, 0.0, 0.0);
    static YELLOW = new Color(1.0, 1.0, 0.0);
    static GREEN = new Color(0.0, 1.0, 0.0);
    static CYAN = new Color(0.0, 1.0, 1.0);
    static BLUE = new Color(0.0, 0.0, 1.0);

    // each channel is a float between 0.0 and 1.0.
    readonly r: number;
    readonly g: number;
    readonly b: number;

    constructor(r: number, g: number, b: number) {
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

    // Blends an array of colors, each optionally with an associated weight.
    static blend(colors: (Color | [number, Color])[]) {
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
}
