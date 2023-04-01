import { ColorUtil } from "./ColorUtil";
import { IColor } from "./IColor";

export class Color implements IColor {

    static readonly DARK_GREY = new Color(0, 1, 1);

    static readonly INDEX_H: number = 0;
    static readonly INDEX_S: number = 1;
    static readonly INDEX_V: number = 2;

    static readonly INDEX_R: number = 0;
    static readonly INDEX_G: number = 1;
    static readonly INDEX_B: number = 2;

    readonly hsv: number[];
    readonly rgb: number[];
    private hex: string | undefined;

    constructor(h: number, s: number, v: number) {
        this.hsv = [h, s, v];
        this.rgb = [0, 0, 0];
        ColorUtil.hsvToRgb(this.hsv, this.rgb);
    }

    getHsv(): number[] {
        return this.hsv;
    }

    getHex(): string {
        if (!this.hex) {
            this.hex = this.getHexRgb(this.rgb);
        }
        return this.hex!;
    }

    getRgb(): number[] {
        return this.rgb;
    }

    getHexRgb(rgb: number[]): string {
        return `#${this.getHexChannel(rgb[Color.INDEX_R])}${this.getHexChannel(rgb[Color.INDEX_G])}${this.getHexChannel(rgb[Color.INDEX_B])}`;
    }

    /**
     * get a hex string from a normalized (0-1) channel value
     * @param channel
     */
    private getHexChannel(channel: number): string {
        const hex = Number(Math.floor(channel * 255)).toString(16);
        if (hex.length < 2) {
            return "0" + hex;
        } else {
            return hex.substring(0, 2);
        }
    };

}