import * as THREE from "three";


export const DirectionMaterials = {
    LINE_RED: new THREE.LineBasicMaterial({ color: 16711680 }),
    LINE_LIGHTRED: new THREE.LineBasicMaterial({ color: 16755370 }),
    LINE_GREEN: new THREE.LineBasicMaterial({ color: 65280 }),
    LINE_LIGHTGREEN: new THREE.LineBasicMaterial({ color: 11206570 }),
    LINE_BLUE: new THREE.LineBasicMaterial({ color: 255 }),
    LINE_LIGHTBLUE: new THREE.LineBasicMaterial({ color: 11184895 }),
};

export enum Side
{
    NONE = 0,
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
