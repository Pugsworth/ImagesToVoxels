export class PixelData
{
    ready: boolean = false;
    _image: HTMLImageElement | null = null
    _canvas: HTMLCanvasElement | null = null
    _context: CanvasRenderingContext2D | null = null


    private _dirty: boolean = false;

    private _width : number = 0;
    public get width() : number { return this._width; }
    public set width(v : number) { this._width = v; }

    private _height : number = 0;
    public get height() : number { return this._height; }
    public set height(v : number) { this._height = v; }

    private _data?: ImageData;
    public get data(): ImageData {
        if (this._dirty) {
            this.prepareImageData();
        }

        return this._data!!;
    }



    constructor(value: HTMLImageElement | URL | string | null, width?: number, height?: number)
    {
        this.createCanvas();
        this.ensureContext();

        if (value instanceof HTMLImageElement) {
            const instance = PixelData.fromImage(value);
            return instance;
        }
        else if ( (value instanceof URL) || (typeof value == "string") ) {
            let instance: PixelData|null = null;

            (async function() {
                instance = await PixelData.fromUrl(value.toString())
            })();

            if (instance == null) {
                throw new Error("Failed to load image from url!");
            }

            return instance;
        }
        else if (value == null) {
            if (width == null || height == null) {
                throw new Error("Invalid input!");
            }

            this._canvas!!.width = width;
            this._canvas!!.height = height;
            this._width = width;
            this._height = height;
        }
        else {
            throw new Error("Invalid input!");
        }

        this.prepareImageData();
    }


    static fromImage(img: HTMLImageElement): PixelData
    {
        const width = img.width;
        const height = img.height;

        const instance = new PixelData(null, width, height);
        instance.drawImage(img, 0, 0, instance.width, instance.height);
        return instance;
    }

    static async fromUrl(url: string): Promise<PixelData | null>
    {
        const img = new Image();

        img.src = url;

        return img.decode().then(() => {
            const instance = new PixelData(img);
            return instance;
        })
        .catch((err) => {
            console.error(`Error loading image from url: '${url}'`);
            return null;
        });
    }

    private createCanvas()
    {
        const canvas = document.createElement("canvas");
        this._canvas = canvas;
    }

    prepareImageData()
    {
        this.assertCanvas();
        this.ensureContext();

        const width = this._canvas!!.width;
        const height = this._canvas!!.height;
        const data = this._context!!.getImageData(0, 0, width, height);
        this._data = data;
    }

    ensureContext()
    {
        this.assertCanvas();

        if (this._context == null) {
            this._context = this._canvas!!.getContext("2d");
        }

        this.ready = true;
    }

    assertCanvas()
    {
        if (this._canvas == null) {
            throw new Error("Canvas not created!");
        }
    }

    drawImage(img: HTMLImageElement, x: number, y: number, width: number, height: number)
    {
        this.assertCanvas();
        this.ensureContext();

        if (width > this._canvas!!.width) {
            this._canvas!!.width = width;
        }

        if (height > this._canvas!!.height) {
            this._canvas!!.height = height;
        }

        this._context!!.drawImage(img, x, y, width, height);
    }

    get(x: number, y: number)
    {
        if (!this.ready) {
            throw new Error("ImageData not ready!");
        }

        this.assertCanvas();

        const columns = this._canvas!!.width;
        const p = (columns * x + y) * 4;
        return {
            r: this.data.data[p],
            g: this.data.data[p + 1],
            b: this.data.data[p + 2],
            a: this.data.data[p + 3]
        };
    }

}
