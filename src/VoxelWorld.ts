// import * as THREE from "../modules/three.js";
import * as THREE from "three";
import { Vec3 } from "./util.js";

export type Options = {
    cellSize?: number,
    tileSize?: number,
    tileTextureWidth?: number,
    tileTextureHeight?: number,
};

export type VoxelData = number | {
    [key: string]: any,
};

// import * as ColorThief from "https://cdnjs.cloudflare.com/ajax/libs/color-thief/2.3.0/color-thief.umd.js";
export class VoxelWorld
{
    static FACES = [
        {
            uvRow: 0,
            dir: [-1, 0, 0,],
            corners: [
                { pos: [0, 1, 0], uv: [0, 1], },
                { pos: [0, 0, 0], uv: [0, 0], },
                { pos: [0, 1, 1], uv: [1, 1], },
                { pos: [0, 0, 1], uv: [1, 0], },
            ],
        },
        {
            uvRow: 0,
            dir: [1, 0, 0,],
            corners: [
                { pos: [1, 1, 1], uv: [0, 1], },
                { pos: [1, 0, 1], uv: [0, 0], },
                { pos: [1, 1, 0], uv: [1, 1], },
                { pos: [1, 0, 0], uv: [1, 0], },
            ],
        },
        {
            uvRow: 1,
            dir: [0, -1, 0,],
            corners: [
                { pos: [1, 0, 1], uv: [1, 0], },
                { pos: [0, 0, 1], uv: [0, 0], },
                { pos: [1, 0, 0], uv: [1, 1], },
                { pos: [0, 0, 0], uv: [0, 1], },
            ],
        },
        {
            uvRow: 2,
            dir: [0, 1, 0,],
            corners: [
                { pos: [0, 1, 1], uv: [1, 1], },
                { pos: [1, 1, 1], uv: [0, 1], },
                { pos: [0, 1, 0], uv: [1, 0], },
                { pos: [1, 1, 0], uv: [0, 0], },
            ],
        },
        {
            uvRow: 0,
            dir: [0, 0, -1,],
            corners: [
                { pos: [1, 0, 0], uv: [0, 0], },
                { pos: [0, 0, 0], uv: [1, 0], },
                { pos: [1, 1, 0], uv: [0, 1], },
                { pos: [0, 1, 0], uv: [1, 1], },
            ],
        },
        {
            uvRow: 0,
            dir: [0, 0, 1,],
            corners: [
                { pos: [0, 0, 1], uv: [0, 0], },
                { pos: [1, 0, 1], uv: [1, 0], },
                { pos: [0, 1, 1], uv: [0, 1], },
                { pos: [1, 1, 1], uv: [1, 1], },
            ],
        },
    ];

    _cellSize: number = 1;
    _tileSize: number = 1;
    _tileTextureWidth: number = 1;
    _tileTextureHeight: number = 1;
    _cellSliceSize: number = 1;
    _cells: any = {};
    _colors: any = [];


    constructor(options: Options={})
    {
        this._cellSize = options.cellSize || 1;
        this._tileSize = options.tileSize || 1;
        this._tileTextureWidth = options.tileTextureWidth || 1;
        this._tileTextureHeight = options.tileTextureHeight || 1;

        this._cellSliceSize = this._cellSize * this._cellSize;
        this._cells = {};
        this._colors = [];
    }

    computeVoxelOffset(x: number, y: number, z: number)
    {
        const voxelX = THREE.MathUtils.euclideanModulo(x, this._cellSize) | 0;
        const voxelY = THREE.MathUtils.euclideanModulo(y, this._cellSize) | 0;
        const voxelZ = THREE.MathUtils.euclideanModulo(z, this._cellSize) | 0;
        return voxelY * this._cellSliceSize +
            voxelZ * this._cellSize +
            voxelX;
    }

    computeCellId(x: number, y: number, z: number)
    {
        const cellX = Math.floor(x / this._cellSize);
        const cellY = Math.floor(y / this._cellSize);
        const cellZ = Math.floor(z / this._cellSize);
        return `${cellX},${cellY},${cellZ}`;
    }

    addCellForVoxel(x: number, y: number, z: number)
    {
        const cellId = this.computeCellId(x, y, z);
        let cell = this._cells[cellId];
        if (!cell) {
            cell = new Uint8Array(Math.pow(this._cellSize, 3));
            this._cells[cellId] = cell;
        }
        return cell;
    }

    getCellForVoxel(x: number, y: number, z: number)
    {
        return this._cells[this.computeCellId(x, y, z)];
    }

    setVoxel(x: number, y: number, z: number, data: VoxelData , addCell = true)
    {
        let cell = this.getCellForVoxel(x, y, z);
        if (!cell) {
            if (!addCell) {
                return;
            }
            cell = this.addCellForVoxel(x, y, z);
        }
        const voxelOffset = this.computeVoxelOffset(x, y, z);
        cell[voxelOffset] = data;
    }

    getVoxel(x: number, y: number, z: number)
    {
        const cell = this.getCellForVoxel(x, y, z);
        if (!cell) {
            return 0;
        }
        const voxelOffset = this.computeVoxelOffset(x, y, z);
        return cell[voxelOffset];
    }

    generateGeometryDataForCell(cellX: number, cellY: number, cellZ: number)
    {
        const positions: number[] = [];
        const normals: number[] = [];
        const uvs: number[] = [];
        const indices: number[] = [];
        const startX = cellX * this._cellSize;
        const startY = cellY * this._cellSize;
        const startZ = cellZ * this._cellSize;

        for (let y = 0; y < this._cellSize; ++y) {
            const voxelY = startY + y;
            for (let z = 0; z < this._cellSize; ++z) {
                const voxelZ = startZ + z;
                for (let x = 0; x < this._cellSize; ++x) {
                    const voxelX = startX + x;
                    const voxel = this.getVoxel(voxelX, voxelY, voxelZ);
                    if (voxel) {
                        // voxel 0 is sky (empty) so for UVs we start at 0
                        const uvVoxel = voxel - 1;
                        // There is a voxel here but do we need faces for it?
                        for (const { dir, corners, uvRow } of VoxelWorld.FACES) {
                            const neighbor = this.getVoxel(
                                voxelX + dir[0],
                                voxelY + dir[1],
                                voxelZ + dir[2]);
                            if (!neighbor) {
                                // this voxel has no neighbor in this direction so we need a face.
                                const ndx = positions.length / 3;
                                for (const { pos, uv } of corners) {
                                    positions.push(pos[0] + x, pos[1] + y, pos[2] + z);
                                    normals.push(...dir);
                                    uvs.push(
                                        (uvVoxel + uv[0]) * this._tileSize / this._tileTextureWidth,
                                        1 - (uvRow + 1 - uv[1]) * this._tileSize / this._tileTextureHeight);
                                }
                                indices.push(
                                    ndx, ndx + 1, ndx + 2,
                                    ndx + 2, ndx + 1, ndx + 3
                                );
                            }
                        }
                    }
                }
            }
        }

        return {
            positions,
            normals,
            uvs,
            indices,
        };
    }

    // from
    // http://www.cse.chalmers.se/edu/year/2010/course/TDA361/grid.pdf
    intersectRay(start: Vec3, end: Vec3)
    {
        let dx = end.x - start.x;
        let dy = end.y - start.y;
        let dz = end.z - start.z;
        const lenSq = dx * dx + dy * dy + dz * dz;
        const len = Math.sqrt(lenSq);

        dx /= len;
        dy /= len;
        dz /= len;

        let t = 0;
        let ix = Math.floor(start.x);
        let iy = Math.floor(start.y);
        let iz = Math.floor(start.z);

        const stepX = (dx > 0) ? 1 : -1;
        const stepY = (dy > 0) ? 1 : -1;
        const stepZ = (dz > 0) ? 1 : -1;

        const txDelta = Math.abs(1 / dx);
        const tyDelta = Math.abs(1 / dy);
        const tzDelta = Math.abs(1 / dz);

        const xDist = (stepX > 0) ? (ix + 1 - start.x) : (start.x - ix);
        const yDist = (stepY > 0) ? (iy + 1 - start.y) : (start.y - iy);
        const zDist = (stepZ > 0) ? (iz + 1 - start.z) : (start.z - iz);

        // location of nearest voxel boundary, in units of t
        let txMax = (txDelta < Infinity) ? txDelta * xDist : Infinity;
        let tyMax = (tyDelta < Infinity) ? tyDelta * yDist : Infinity;
        let tzMax = (tzDelta < Infinity) ? tzDelta * zDist : Infinity;

        let steppedIndex = -1;

        // main loop along raycast vector
        while (t <= len) {
            const voxel = this.getVoxel(ix, iy, iz);
            if (voxel) {
                return {
                    position: [
                        start.x + t * dx,
                        start.y + t * dy,
                        start.z + t * dz,
                    ],
                    normal: [
                        steppedIndex === 0 ? -stepX : 0,
                        steppedIndex === 1 ? -stepY : 0,
                        steppedIndex === 2 ? -stepZ : 0,
                    ],
                    voxel,
                };
            }

            // advance t to next nearest voxel boundary
            if (txMax < tyMax) {
                if (txMax < tzMax) {
                    ix += stepX;
                    t = txMax;
                    txMax += txDelta;
                    steppedIndex = 0;
                } else {
                    iz += stepZ;
                    t = tzMax;
                    tzMax += tzDelta;
                    steppedIndex = 2;
                }
            } else {
                if (tyMax < tzMax) {
                    iy += stepY;
                    t = tyMax;
                    tyMax += tyDelta;
                    steppedIndex = 1;
                } else {
                    iz += stepZ;
                    t = tzMax;
                    tzMax += tzDelta;
                    steppedIndex = 2;
                }
            }
        }
        return null;
    }
}
