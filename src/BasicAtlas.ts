
class BasicAtlas
{
    _atlasImage = null;
    _images: HTMLImageElement[] = []; // List of images used to create this atlas.
    constructor()
    {
    }

    /**
     * Build the atlas
     */
    build()
    {
        const canvas = document.createElement("canvas");
        canvas.width = 16 * this._images.length;
        canvas.height = 16;
        const ctx = canvas.getContext("2d");

        let i = 0;
        this._images.forEach((img) => {
            ctx?.drawImage(img, i * 16, 0);
            i++;
        });

        let url = canvas.toDataURL("image/png");

    }

    /**
     * Add an image to the atlas in the next available spot.
     * Can accept a callback for raw canvas drawing.
     */
    addImage(img: HTMLImageElement) {
        this._images.push(img);
    }

    /**
     * Get an image that represents this atlas.
     */
    getImage()
    {
    }

    /**
     * Get's the data url that represents this atlas.
     */
    getDataUrl()
    {
    }

    /**
     * Get's the UV coordinates for the nth texture in this atlas.
     */
    getTexture(n: number)
    {
    }
}
