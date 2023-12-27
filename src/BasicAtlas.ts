import { UV2, Size2, PackedColor } from "./util";

export type ImageType = HTMLImageElement | PackedColor;

export class BasicAtlas
{
    _atlasImage?: HTMLImageElement;
    _images: ImageType[] = []; // List of images used to create this atlas.
    _resolution: number;

    constructor(res: number = 16)
    {
        this._resolution = res;
    }

    /**
     * Build the atlas.
     */
    build(): HTMLImageElement
    {
        const canvas = this.getOrCreateCanvas();
        const size = this.calculateResolution();

        canvas.width = size.width;
        canvas.height = size.height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
            throw new Error("Unable to get drawing context!");
        }

        ctx.clearRect(0, 0, size.width, size.height);
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, size.width, size.height);

        // TODO: non-square images?
        const res = this._resolution;

        for (let i = 0; i < this._images.length; i++) {
            const item = this._images[i];
            // i -> x,y
            const x = (i * res) % size.width;
            const y = Math.floor((i * res) / size.width) * res;
            console.log(`Drawing ${i} at ${x},${y} (${res}x${res})`);


            if (item instanceof HTMLImageElement) {
                ctx.drawImage(item, x, y, res, res);
            }
            else if (typeof item == "number") {
                ctx.fillStyle = `#${item.toString(16)}`;
                console.log(`Drawing color ${ctx.fillStyle}`);

                ctx.fillRect(x, y, res, res);
            }
        }

        const url = canvas.toDataURL("image/png");

        this._atlasImage = new Image();
        this._atlasImage.src = url;

        return this._atlasImage;
    }

    /**
     * Adds a solid color image to the atlas.
     * @param color {PackedColor} The color to add.
     */
    addColor(color: PackedColor)
    {
        if (!this._images.includes(color)) {
            this._images.push(color);
        }
    }

    /**
     * Add an image to the atlas in the next available spot.
     * Can accept a callback for raw canvas drawing.
     */
    addImage(img: HTMLImageElement): void
    {
        this._images.push(img);
    }

    /**
     * Get an image that represents this atlas.
     */
    getImage(): HTMLImageElement
    {
        if (!this._atlasImage) {
            this.build();
        }

        if (!this._atlasImage) {
            throw new Error("Unable to build atlas");
        }

        return this._atlasImage;
    }

    /**
     * Get's the data url that represents this atlas.
     */
    getDataUrl()
    {
        throw new Error("Not implemented");
    }

    /**
     * Get the UV coordinates for the texture at the given index.
     * @param i {number} The index of the texture.
     * @returns {UV2} The UV coordinates for the texture.
     * @throws Error if the index is out of bounds.
     */
    getTextureFromIndex(i: number): UV2
    {
        const res = this._resolution;
        const x = i % res;
        const y = Math.floor(i / res);

        return {
            u: x / res,
            v: y / res,
        };
    }

    /**
     * Get the UV coordinates for the texture at the given coordinate.
     *
     * Coordinates are floored to the nearest integer.
     *
     * @param x {number} The x coordinate of the texture.
     * @param y {number} The y coordinate of the texture.
     * @returns {UV2} The UV coordinates for the texture.
     * @throws Error if the coordinate is out of bounds.
     */
    getTextureFromCoord(x: number, y: number): UV2
    {
        const res = this._resolution;

        return {
            u: x / res,
            v: y / res,
        };
    }

    /**
     * Calculates the smallest power of two square that can fit all the images.
     *
     * @returns {Size2} The size of the atlas.
     */
    calculateResolution(): Size2
    {
        let size = Math.ceil(Math.sqrt(this._images.length));
        size = Math.pow(2, Math.ceil(Math.log2(size)));

        if (size == 0) {
            throw new Error("Invalid size: " + size);
        }

        return {
            width: size * this._resolution,
            height: size * this._resolution,
        };
    }

    /**
     * Get's the canvas for this atlas.
     * @returns {HTMLCanvasElement} The canvas for this atlas.
     */
    getOrCreateCanvas(): HTMLCanvasElement
    {
        return document.createElement("canvas");
    }

    /**
     * Get's the drawing context for this atlas.
     * @returns {CanvasRenderingContext2D} The drawing context for this atlas.
     */
    getDrawingContext(): CanvasRenderingContext2D
    {
        const canvas = this.getOrCreateCanvas();
        const ctx = canvas.getContext("2d");
        if (!ctx) {
            throw new Error("Unable to get drawing context!");
        }

        return ctx;
    }
}
