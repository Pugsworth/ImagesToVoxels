// Three.js - Voxel Geometry - UI
// from https://threejsfundamentals.org/threejs/threejs-voxel-geometry-culled-faces-ui.html

// import * as THREE from "./modules/three.js";
// import CameraControls from "./modules/camera-controls.js";
import * as THREE from "three";
// import CameraControls from "camera-controls";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { PixelData } from "./src/PixelData.ts";
import { Side, addPreviewImage, getMaterialForSide, resizeImage, toThreeVector3, vec2 } from "./src/util.ts";
import { DirectionColor } from "./src/DirectionColor.ts";
import { VoxelWorld } from "./src/VoxelWorld.ts";

import mushroomImage from "./assets/images/brown_mushroom.png";


// CameraControls.install({ THREE: THREE });

async function main() {
    const clock = new THREE.Clock();

    const canvas = document.querySelector('#c') as HTMLCanvasElement;
    if (canvas == null) {
        throw new Error("Failed to find any elements with id: '#c'!");
    }
    const renderer = new THREE.WebGLRenderer({canvas});

    const cellSize = 16;

    const fov = 75;
    const aspect = 2;  // the canvas default
    const near = 0.1;
    const far = 1000;
    const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    camera.position.set(-cellSize * .3, cellSize * .8, -cellSize * .3);


    // const controls = new CameraControls(camera, renderer.domElement);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target = new THREE.Vector3(cellSize / 2, cellSize / 3, cellSize / 2);
    // controls.setTarget(cellSize / 2, cellSize / 3, cellSize / 2);
    controls.update(0);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("lightblue");

    const tileSize = 16;
    const tileTextureWidth = 256;
    const tileTextureHeight = 64;
    const loader = new THREE.TextureLoader();
    const texture = loader.load("https://threejsfundamentals.org/threejs/resources/images/minecraft/flourish-cc-by-nc-sa.png");
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;

    const addPreview = (tex: THREE.Texture|HTMLImageElement) => {
        if (tex instanceof THREE.Texture) {
            tex.magFilter = THREE.NearestFilter;
            tex.minFilter = THREE.NearestFilter;

            const img = document.createElement("img");
        img.classList.add("preview");
            img.src = tex.image.src;

            addPreviewImage(img);
        } else {
            addPreviewImage(tex);
        }
        parent.appendChild(img);
    };

    const sprites: any[] = [
        // await resizeImage("https://static.wikia.nocookie.net/minecraftpocketedition/images/e/e1/Red_Mushroom.png", vec2(8, 8))
        await resizeImage(mushroomImage, vec2(16, 16))
              .then((url) => {
                  return new Promise((resolve, reject) => {
                      const tex = loader.load(url as any, () => {
                          console.log("Loaded texture");
                          addPreview(tex);
                          resolve(tex);
                      });
                  });
              }),
    ];

    {
        let material = new THREE.MeshBasicMaterial({
            map: sprites[0],
            side: THREE.DoubleSide,
            alphaTest: 0.1,
            transparent: false,
        });
        let geometry = new THREE.PlaneGeometry(cellSize, cellSize);
        let mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(cellSize/2, cellSize/2, 0);

        let mesh2 = mesh.clone();
        mesh2.rotateOnAxis(new THREE.Vector3(0, 1, 0), -Math.PI/2);
        mesh2.position.set(0, cellSize/2, cellSize/2);

        scene.add(mesh);
        scene.add(mesh2);
    }


    function addLight(x: number, y: number, z: number) {
        const color = 0xFFFFFF;
        const intensity = 1;
        const light = new THREE.DirectionalLight(color, intensity);
        light.position.set(x, y, z);
        scene.add(light);
    }
    addLight(-1,  2,  4);
    addLight( 1, -1, -2);

    const world = new VoxelWorld({
        cellSize,
        tileSize,
        tileTextureWidth,
        tileTextureHeight,
    });

    const material = new THREE.MeshLambertMaterial({
        map: texture,
        side: THREE.DoubleSide,
        alphaTest: 0.1,
        transparent: true,
    });

    const cellIdToMesh = {};
    function updateCellGeometry(x: number, y: number, z: number) {
        const cellX = Math.floor(x / cellSize);
        const cellY = Math.floor(y / cellSize);
        const cellZ = Math.floor(z / cellSize);
        const cellId = world.computeCellId(x, y, z);
        let mesh = cellIdToMesh[cellId];
        if (!mesh) {
            const geometry = new THREE.BufferGeometry();
            const positionNumComponents = 3;
            const normalNumComponents = 3;
            const uvNumComponents = 2;

            geometry.setAttribute(
                "position",
                new THREE.BufferAttribute(new Float32Array(0), positionNumComponents));
            geometry.setAttribute(
                "normal",
                new THREE.BufferAttribute(new Float32Array(0), normalNumComponents));
            geometry.setAttribute(
                "uv",
                new THREE.BufferAttribute(new Float32Array(0), uvNumComponents));

            mesh = new THREE.Mesh(geometry, material);
            mesh.name = cellId;
            cellIdToMesh[cellId] = mesh;
            scene.add(mesh);
            mesh.position.set(cellX * cellSize, cellY * cellSize, cellZ * cellSize);
        }

        const {positions, normals, uvs, indices} = world.generateGeometryDataForCell(cellX, cellY, cellZ);
        const geometry = mesh.geometry;

        geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(positions), 3));
        geometry.setAttribute("normal", new THREE.BufferAttribute(new Float32Array(normals), 3));
        geometry.setAttribute("uv", new THREE.BufferAttribute(new Float32Array(uvs), 2));
        // geometry.getAttribute("position").set(new Float32Array(positions)).needsUpdate = true;
        // geometry.getAttribute("normal").set(new Float32Array(normals)).needsUpdate = true;
        // geometry.getAttribute("uv").set(new Float32Array(uvs)).needsUpdate = true;
        geometry.setIndex(indices);
        geometry.computeBoundingSphere();
    }

    const neighborOffsets = [
        [ 0,  0,  0], // self
        [-1,  0,  0], // left
        [ 1,  0,  0], // right
        [ 0, -1,  0], // down
        [ 0,  1,  0], // up
        [ 0,  0, -1], // back
        [ 0,  0,  1], // front
    ];
    function updateVoxelGeometry(x: number, y: number, z: number) {
        const updatedCellIds = {};
        for (const offset of neighborOffsets) {
            const ox = x + offset[0];
            const oy = y + offset[1];
            const oz = z + offset[2];
            const cellId = world.computeCellId(ox, oy, oz);
            if (!updatedCellIds[cellId]) {
                updatedCellIds[cellId] = true;
                updateCellGeometry(ox, oy, oz);
            }
        }
    }

    const center = cellSize/2;
    const centerSqr = center*center;

    const _img = sprites[0].image;
    console.log(`Loading pixels for '${_img}'`);

    function palettize(img: HTMLImageElement, maxColors: number)
    {
        const colors = [
            0xCCCCCC,
            0xC41C24,
            0x949494,
            0x7C4444,
            0xFC2C2C,
            0xE41414,
            0x542C2C,
            0x9C141C,
            0xC04088,
            0xE8A0B4,
            0xC01428,
            0x941430
        ];
        const pixels = new PixelData(img, img.width, img.height);
        const colorPalette = {}; // Convert each of the colors into an indexed color for reference later.
        const paletteLookup = {};

        let i = 0;
        for (let x = 0; x < img.width; x++) {
            for (let y = 0; y < img.height; y++) {
                const color = pixels.get(x, y);
                if (color.a < 127) {
                    continue;
                }

                const hash = (color.r << 16) | (color.g << 8) | color.b;
                if (colorPalette[hash] == undefined) {
                    colorPalette[hash] = i++;
                }
            }
        }

        return colorPalette;
    }

    const pixels = new PixelData(_img, _img.width, _img.height);
    pixels.prepareImageData();
    // const palette = pixels.getPalette(8);
    const colorLookup = palettize(_img, 8);

    // TODO: Implement some kind of "sided" sampler.

    function sampleSide(pixelData: PixelData, side: Side, x: number, y: number, z: number) {
        const w = pixelData.width;
        const h = pixelData.height;

        switch(side) {
            case Side.NORTH: return pixelData.get(w-y, z);
            case Side.SOUTH: return pixelData.get(w-y, h-z);
            case Side.EAST: return pixelData.get(h-y, x);
            case Side.WEST: return pixelData.get(h-y, w-x);
            case Side.TOP: return pixelData.get(x, z);
            case Side.BOTTOM: return pixelData.get(x, z);
            default: return null;
        }
    }

    for (let y = 0; y < cellSize; ++y) {
        for (let z = 0; z < cellSize; ++z) {
            for (let x = 0; x < cellSize; ++x) {

                let px = center - x;
                let color = sampleSide(pixels, Side.EAST, x, y+1, z);
                let color2 = sampleSide(pixels, Side.NORTH, x, y+1, z);
                if (color == null && color2 == null) {
                    continue
                }

                let ex = (color?.a || 0) & (color2?.a || 0);

                // let color = pixels.get(cellSize - y, z - cellSize);

                // console.log(`x:${px}, y:${y} = ${JSON.stringify(color)}`);

                if (ex > 127) {
                    // const hash = (color.r << 16) | (color.g << 8) | color.b;
                    // const c = colorLookup[hash]; // This should never be undefined since we just fetched all of these values.
                    world.setVoxel(x, y, z, randInt(1, 17));
                }


                /*
                const height = (Math.sin(x / cellSize * Math.PI * 2) + Math.sin(z / cellSize * Math.PI * 3)) * (cellSize / 6) + (cellSize / 2);
                if (y < height) {
                    world.setVoxel(x, y, z, randInt(1, 17));
                }
                */

                /*
                const radius = 24;
                const dist = (
                    Math.pow(center-x, 2)-1
                  + Math.pow(center-y, 2)-1
                  + Math.pow(center-z, 2)-1
                );

                if (dist <= radius)
                    world.setVoxel(x, y, z, randInt(3, 6));
                */
            }
        }
    }

    function randInt(min: number, max: number) {
        return Math.floor(Math.random() * (max - min) + min);
    }

    updateVoxelGeometry(1, 1, 1);  // 0,0,0 will generate


    ////////////////////////////////////////////////////////////////////////////////



    function line(origin: THREE.Vector3, dest: THREE.Vector3, material: THREE.LineBasicMaterial) {
        const points = [
            origin,
            dest
        ];

        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const line = new THREE.Line(geometry, material);

        return line;
    }

    function addCross(scene: THREE.Scene, origin: THREE.Vector3, size: number) {
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

    function addCorner(scene: THREE.Scene, origin: THREE.Vector3, size: number, directions: Side[]) {
        directions.forEach((side) => {
            let mat = getMaterialForSide(side);
            let dir = toThreeVector3(DirectionColor.of(side).vector);

            scene.add(
                line(origin, dir.clone().multiplyScalar(size).add(origin), mat)
            );
        });
    }

    const ORIGIN = new THREE.Vector3(0, 0, 0);
    const CENTER = new THREE.Vector3(center, center, center);

    // Draw the bounds of the voxel space
    addCross(scene, CENTER, 1.0);
    addCorner(scene, new THREE.Vector3(0, 0, 0), 5.0, [Side.NORTH, Side.EAST, Side.TOP]);
    addCorner(scene, new THREE.Vector3(1, 0, 0).multiplyScalar(cellSize), 5.0, [Side.SOUTH, Side.EAST, Side.TOP]);
    addCorner(scene, new THREE.Vector3(0, 1, 0).multiplyScalar(cellSize), 5.0, [Side.NORTH, Side.EAST, Side.BOTTOM]);
    addCorner(scene, new THREE.Vector3(0, 0, 1).multiplyScalar(cellSize), 5.0, [Side.NORTH, Side.WEST, Side.TOP]);
    addCorner(scene, new THREE.Vector3(1, 1, 0).multiplyScalar(cellSize), 5.0, [Side.SOUTH, Side.EAST, Side.BOTTOM]);
    addCorner(scene, new THREE.Vector3(1, 0, 1).multiplyScalar(cellSize), 5.0, [Side.SOUTH, Side.WEST, Side.TOP]);
    addCorner(scene, new THREE.Vector3(0, 1, 1).multiplyScalar(cellSize), 5.0, [Side.NORTH, Side.WEST, Side.BOTTOM]);
    addCorner(scene, new THREE.Vector3(0, 1, 1).multiplyScalar(cellSize), 5.0, [Side.NORTH, Side.WEST, Side.BOTTOM]);
    addCorner(scene, new THREE.Vector3(1, 1, 1).multiplyScalar(cellSize), 5.0, [Side.SOUTH, Side.WEST, Side.BOTTOM]);

    ////////////////////////////////////////////////////////////////////////////////


    function resizeRendererToDisplaySize(renderer) {
        const canvas = renderer.domElement;
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;
        const needResize = canvas.width !== width || canvas.height !== height;
        if (needResize) {
            renderer.setSize(width, height, false);
        }
        return needResize;
    }

    let renderRequested = false;

    function render() {
        renderRequested = false;

        const delta = clock.getDelta();
        const time = clock.getElapsedTime();

        if (resizeRendererToDisplaySize(renderer)) {
            const canvas = renderer.domElement;
            camera.aspect = canvas.clientWidth / canvas.clientHeight;
            camera.updateProjectionMatrix();
        }

        controls.update(delta);
        renderer.render(scene, camera);

        requestAnimationFrame(render);
    }
    render();

    function requestRenderIfNotRequested() {
        if (!renderRequested) {
            renderRequested = true;
            requestAnimationFrame(render);
        }
    }

    let currentVoxel = 0;
    let currentId;

    document.querySelectorAll("#ui .tiles input[type=radio][name=voxel]").forEach((elem) => {
        elem.addEventListener("click", allowUncheck);
    });

    function allowUncheck() {
        if (this.id === currentId) {
            this.checked = false;
            currentId = undefined;
            currentVoxel = 0;
        } else {
            currentId = this.id;
            currentVoxel = parseInt(this.value);
        }
    }

    function getCanvasRelativePosition(event) {
        const rect = canvas!!.getBoundingClientRect();
        return {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top,
        };
    }

    function placeVoxel(event) {
        const pos = getCanvasRelativePosition(event);
        const x = (pos.x / canvas!!.clientWidth ) *  2 - 1;
        const y = (pos.y / canvas!!.clientHeight) * -2 + 1;  // note we flip Y

        const start = new THREE.Vector3();
        const end = new THREE.Vector3();
        start.setFromMatrixPosition(camera.matrixWorld);
        end.set(x, y, 1).unproject(camera);

        const intersection = world.intersectRay(start, end);
        if (intersection) {
            const voxelId = event.shiftKey ? 0 : currentVoxel;
            // the intersection point is on the face. That means
            // the math imprecision could put us on either side of the face.
            // so go half a normal into the voxel if removing (currentVoxel = 0)
            // our out of the voxel if adding (currentVoxel  > 0)
            const pos = intersection.position.map((v, ndx) => {
                return v + intersection.normal[ndx] * (voxelId > 0 ? 0.5 : -0.5);
            });
            // @ts-ignore
            world.setVoxel(...pos, voxelId);
            // @ts-ignore
            updateVoxelGeometry(...pos);
            requestRenderIfNotRequested();
        }
    }

    const mouse = {
        x: 0,
        y: 0,
        moveX: 0,
        moveY: 0,
    };

    function recordStartPosition(event) {
        mouse.x = event.clientX;
        mouse.y = event.clientY;
        mouse.moveX = 0;
        mouse.moveY = 0;
    }
    function recordMovement(event) {
        mouse.moveX += Math.abs(mouse.x - event.clientX);
        mouse.moveY += Math.abs(mouse.y - event.clientY);
    }
    function placeVoxelIfNoMovement(event) {
        if (mouse.moveX < 5 && mouse.moveY < 5) {
            placeVoxel(event);
        }
        window.removeEventListener("mousemove", recordMovement);
        window.removeEventListener("mouseup", placeVoxelIfNoMovement);
    }
    canvas.addEventListener('mousedown', (event: any) => {
        event.preventDefault();
        recordStartPosition(event);
        window.addEventListener("mousemove", recordMovement);
        window.addEventListener("mouseup", placeVoxelIfNoMovement);
    }, {passive: false});
    canvas.addEventListener("touchstart", (event: any) => {
        event.preventDefault();
        recordStartPosition(event.touches[0]);
    }, {passive: false});
    canvas.addEventListener("touchmove", (event: any) => {
        event.preventDefault();
        recordMovement(event.touches[0]);
    }, {passive: false});
    canvas.addEventListener("touchend", () => {
        placeVoxelIfNoMovement({
            clientX: mouse.x,
            clientY: mouse.y,
        });
    });

    controls.addEventListener("update", requestRenderIfNotRequested);
    window.addEventListener("resize", requestRenderIfNotRequested);
}

main();
