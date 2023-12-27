// import * as THREE from "../modules/three.js";
import * as THREE from "three";
import { PixelData } from "./PixelData";
import { DirectionColor } from "./DirectionColor";
import { Side, getMaterialForSide } from "./Side";

export type Vec2 = { x: number, y: number };
export type Vec3 = { x: number, y: number, z: number };
export type UV2 = { u: number, v: number };
export type Size2 = { width: number, height: number };

export function vec2(x: number = 0, y: number = x): Vec2
{
    return { x, y };
}
export function vec3(x: number = 0, y: number = x, z: number = x): Vec3
{
    return { x, y, z };
}

export function size2(width: number = 0, height: number = width): Size2
{
    return { width, height };
}

export function uv2(u: number = 0, v: number = u): UV2
{
    return { u, v };
}

export function toThreeVector3(v: Vec3): THREE.Vector3
{
    return new THREE.Vector3(v.x, v.y, v.z);
}

export type PackedColor = number;

interface DirectionColors
{
    [key: string]: PackedColor;
}

/**
 * The colors for each direction.
 */
export const DirectionColors: DirectionColors = {
    [Side[Side.NORTH].toLowerCase()]: 0xFF0000,
    [Side[Side.SOUTH].toLowerCase()]: 0xFF0000,
    [Side[Side.EAST].toLowerCase()]: 0x00FF00,
    [Side[Side.WEST].toLowerCase()]: 0x00FF00,
    [Side[Side.TOP].toLowerCase()]: 0x0000FF,
    [Side[Side.BOTTOM].toLowerCase()]: 0x0000FF,
};

export async function resizeImage(url: string, newSize: Vec2)
{
    return new Promise((resolve, reject) =>
    {
        const canvas = document.createElement("canvas");
        const img = new Image();
        img.src = url;
        img.decode().then(() =>
        {
            canvas.width = newSize.x;
            canvas.height = newSize.y;
            const ctx = canvas.getContext("2d", { alpha: true });
            if (ctx == null) {
                reject(new Error("Failed to get 2d context"));
                return;
            }

            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            const url = canvas.toDataURL("image/png");
            resolve(url);
        });
    });
}



/**
 * Wrapper to load an image from a url and return a promise.
 *
 * @deprecated Use HTMLImageElement.decode instead.
 *
 * @param {string} url Url as a string to load the image from.
 * @param {number} [timeout=30000] Timeout in milliseconds to reject the promise.
 * @return {Promise<HTMLImageElement>}
 */
export async function loadImage(url: string, timeout = 30000)
{
    return new Promise((resolve, reject) =>
    {
        const timeoutId = setTimeout(() =>
        {
            reject(new Error("Timeout loading image: " + url));
        }, timeout);

        const img = new Image();
        img.onload = () =>
        {
            clearTimeout(timeoutId);
            resolve(img);
        };
        img.onerror = reject;
        img.src = url;
    });
}

export function addPreviewImage(img: HTMLImageElement)
{
    const parent = document.querySelector("#sprite-previews");
    if (!parent) {
        throw new Error("Unable to find sprite previews parent");
    }

    const div = document.createElement("div");
    div.classList.add("preview");
    div.appendChild(img);

    parent.appendChild(div);
}

export function randInt(min: number, max: number)
{
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function packColor32(r: number, g: number, b: number, a: number = 255)
{
    // return a << 24 | b << 16 | g << 8 | r;
    return (r << 24) | (g << 16) | (b << 8) | a;
}

export function packColor24(r: number, g: number, b: number)
{
    // return b << 16 | g << 8 | r;
    return (r << 16) | (g << 8) | b;
}

export function indexToVec3(index: number, width: number, height: number)
{
    const x = index % width;
    const y = Math.floor(index / width) % height;
    const z = Math.floor(index / (width * height));

    return vec3(x, y, z);
}

export function vec3ToIndex(v: Vec3, width: number, height: number)
{
    return v.x + v.y * width + v.z * width * height;
}

export function indexToVec2(index: number, width: number)
{
    const x = index % width;
    const y = Math.floor(index / width);

    return vec2(x, y);
}

export function vec2ToIndex(v: Vec2, width: number)
{
    return v.x + v.y * width;
}

export function addLight(scene: THREE.Scene, x: number, y: number, z: number, color: number = 0xFFFFFF, intensity: number = 1.0)
{
    const light = new THREE.PointLight(color, intensity, 100);
    light.position.set(x, y, z);
    const helper = new THREE.PointLightHelper(light, 1);
    light.add(helper);
    scene.add(light);
}

export function addSun(scene: THREE.Scene, x: number, y: number, z: number, azimuth: number, zenith: number, color: number=  0xFFFFFF, intensity: number = 1.0)
{
    const sunlight = new THREE.DirectionalLight(color, intensity);
    sunlight.position.set(x, y, z);
    sunlight.castShadow = true;
    sunlight.shadow.mapSize.width = 512;
    sunlight.shadow.mapSize.height = 512;

    const targetHelper = new THREE.Mesh(
        new THREE.SphereGeometry(1.0, 6, 3),
        new THREE.MeshBasicMaterial({ color: 0x00FF00, wireframe: true })
    );
    sunlight.target.add(targetHelper);

    // Since a directional light rotates towards the target, we must calcualte the position of the target from
    // the desired angles.
    const tx = Math.sin(azimuth) * Math.cos(zenith) * 16;
    const ty = Math.sin(zenith) * 16;
    const tz = Math.cos(azimuth) * Math.cos(zenith) * 16;
    sunlight.target.position.set(tx, ty, tz);
    sunlight.target.position.set(2, 8, 16);
    scene.add(sunlight.target);

    const helper = new THREE.DirectionalLightHelper(sunlight, 1);
    sunlight.add(helper);

    helper.update();

    scene.add(sunlight);
}

export function sampleSide(pixelData: PixelData, side: Side, x: number, y: number, z: number)
{
    const w = pixelData.width;
    const h = pixelData.height;

    switch (side) {
        case Side.NORTH: return pixelData.get(w - y, z);
        case Side.SOUTH: return pixelData.get(w - y, h - z);
        case Side.EAST: return pixelData.get(h - y, x);
        case Side.WEST: return pixelData.get(h - y, w - x);
        case Side.TOP: return pixelData.get(x, z);
        case Side.BOTTOM: return pixelData.get(x, z);
        default: return null;
    }
}

export function line(origin: THREE.Vector3, dest: THREE.Vector3, material: THREE.LineBasicMaterial)
{
    const points = [
        origin,
        dest
    ];

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const line = new THREE.Line(geometry, material);

    return line;
}

export function addCross(scene: THREE.Scene, origin: THREE.Vector3, size: number)
{
    let mat = getMaterialForSide(Side.TOP);
    scene.add(
        line(origin, toThreeVector3(DirectionColor.UP.vector).multiplyScalar(size).add(origin), mat)
    );

    mat = getMaterialForSide(Side.BOTTOM);
    scene.add(
        line(origin, toThreeVector3(DirectionColor.DOWN.vector).multiplyScalar(size).add(origin), mat)
    );

    mat = getMaterialForSide(Side.NORTH);
    scene.add(
        line(origin, toThreeVector3(DirectionColor.NORTH.vector).multiplyScalar(size).add(origin), mat)
    );

    mat = getMaterialForSide(Side.SOUTH);
    scene.add(
        line(origin, toThreeVector3(DirectionColor.SOUTH.vector).multiplyScalar(size).add(origin), mat)
    );

    mat = getMaterialForSide(Side.EAST);
    scene.add(
        line(origin, toThreeVector3(DirectionColor.EAST.vector).multiplyScalar(size).add(origin), mat)
    );

    mat = getMaterialForSide(Side.WEST);
    scene.add(
        line(origin, toThreeVector3(DirectionColor.WEST.vector).multiplyScalar(size).add(origin), mat)
    );
}

export function addCorner(scene: THREE.Scene, origin: THREE.Vector3, size: number, directions: Side[])
{
    directions.forEach((side) =>
    {
        const mat = getMaterialForSide(side);
        const dir = toThreeVector3(DirectionColor.of(side).vector);

        scene.add(
            line(origin, dir.clone().multiplyScalar(size).add(origin), mat)
        );
    });
}

export function resizeRendererToDisplaySize(renderer: THREE.WebGLRenderer): boolean
{
    const canvas = renderer.domElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const needResize = canvas.width !== width || canvas.height !== height;

    if (needResize) {
        renderer.setSize(width, height, false);
    }

    return needResize;
}


export function getMousePositionRelative(element: HTMLElement, event: MouseEvent): Vec2
{
    const rect = element.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    return vec2(x, y);
}

export function deg2rad(degrees: number)
{
    return degrees * Math.PI / 180;
}

export function rad2deg(radians: number)
{
    return radians * 180 / Math.PI;
}

export function kelvinRGB(temperature: number): PackedColor
{
    let r, g, b;

    temperature /= 100;

    if (temperature <= 66) {
        r = 255;
    } else {
        r = temperature - 60;
        r = 329.698727446 * Math.pow(r, -0.1332047592);
        if (r < 0) {
            r = 0;
        }
        if (r > 255) {
            r = 255;
        }
    }

    if (temperature <= 66) {
        g = temperature;
        g = 99.4708025861 * Math.log(g) - 161.1195681661;
        if (g < 0) {
            g = 0;
        }
        if (g > 255) {
            g = 255;
        }
    } else {
        g = temperature - 60;
        g = 288.1221695283 * Math.pow(g, -0.0755148492);
        if (g < 0) {
            g = 0;
        }
        if (g > 255) {
            g = 255;
        }
    }

    if (temperature >= 66) {
        b = 255;
    } else {
        if (temperature <= 19) {
            b = 0;
        } else {
            b = temperature - 10;
            b = 138.5177312231 * Math.log(b) - 305.0447927307;
            if (b < 0) {
                b = 0;
            }
            if (b > 255) {
                b = 255;
            }
        }
    }

    return packColor24(r, g, b);
}