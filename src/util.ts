// import * as THREE from "../modules/three.js";
import * as THREE from "three";

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

export const DirectionMaterials = {
    LINE_RED: new THREE.LineBasicMaterial({ color: 0xFF0000 }),
    LINE_LIGHTRED: new THREE.LineBasicMaterial({ color: 0xFFAAAA }),
    LINE_GREEN: new THREE.LineBasicMaterial({ color: 0x00FF00 }),
    LINE_LIGHTGREEN: new THREE.LineBasicMaterial({ color: 0xAAFFAA }),
    LINE_BLUE: new THREE.LineBasicMaterial({ color: 0x0000FF }),
    LINE_LIGHTBLUE: new THREE.LineBasicMaterial({ color: 0xAAAAFF }),
};

export enum Side
{
    NONE,
    TOP,
    BOTTOM,
    NORTH,
    SOUTH,
    EAST,
    WEST
}


export function getMaterialForSide(side: Side): THREE.LineBasicMaterial
{
    switch (side) {
        case Side.TOP:
            return DirectionMaterials.LINE_BLUE;
        case Side.BOTTOM:
            return DirectionMaterials.LINE_LIGHTBLUE;
        case Side.NORTH:
            return DirectionMaterials.LINE_RED;
        case Side.SOUTH:
            return DirectionMaterials.LINE_LIGHTRED;
        case Side.EAST:
            return DirectionMaterials.LINE_GREEN;
        case Side.WEST:
            return DirectionMaterials.LINE_LIGHTGREEN;
        default:
            throw new Error("Invalid side: " + side);
    }
}

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


/**
 * Generates a texture atlas from a list of colors.
 * @returns {Object} Atlas object that can return uvs
 */

async function generateColorAtlas(colors: any)
{
}

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