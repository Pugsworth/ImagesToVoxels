// Three.js - Voxel Geometry - UI
// from https://threejsfundamentals.org/threejs/threejs-voxel-geometry-culled-faces-ui.html

import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { ViewHelper } from "three/examples/jsm/helpers/ViewHelper.js";
import { BasicAtlas } from "./src/BasicAtlas.ts";
import { PixelData } from "./src/PixelData.ts";
import { VoxelWorld } from "./src/VoxelWorld.ts";

// @ts-expect-error Importing images results in a "cannot find module" error.
import mushroomImage from "./assets/images/brown_mushroom.png";
import { addCorner, addCross, addLight, addPreviewImage, addSun, deg2rad, getMousePositionRelative, kelvinRGB, packColor24, randInt, resizeImage, resizeRendererToDisplaySize, sampleSide, vec2 } from "./src/util.ts";
import { Side } from "./src/Side.ts";


async function main()
{
    const clock = new THREE.Clock();

    const canvas = document.querySelector('#c') as HTMLCanvasElement;
    if (canvas == null) {
        throw new Error("Failed to find any elements with id: '#c'!");
    }
    const renderer = new THREE.WebGLRenderer({ canvas });
    renderer.autoClear = false;

    const cellSize = 16;

    const fov = 75;
    const aspect = 2;  // the canvas default
    const near = 0.1;
    const far = 1000;
    const zoom = 20;
    // const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    const camera = new THREE.OrthographicCamera(-1*zoom, 1*zoom, 1*zoom, -1*zoom, near, far);
    camera.position.set(-cellSize * .3, cellSize * .8, -cellSize * .3);


    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target = new THREE.Vector3(cellSize / 2, cellSize / 3, cellSize / 2);
    controls.update(0);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("lightblue");

    const viewHelper = new ViewHelper(camera, renderer.domElement);

    const tileSize = 16;
    const tileTextureWidth = 64;
    const tileTextureHeight = 64;
    const loader = new THREE.TextureLoader();
    const texture = loader.load("https://threejsfundamentals.org/threejs/resources/images/minecraft/flourish-cc-by-nc-sa.png");
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;

    const addPreview = (tex: THREE.Texture | HTMLImageElement) =>
    {
        if (tex instanceof THREE.Texture) {
            tex.magFilter = THREE.NearestFilter;
            tex.minFilter = THREE.NearestFilter;

            const img = document.createElement("img");
            img.src = tex.image.src;

            addPreviewImage(img);
        } else {
            addPreviewImage(tex);
        }
    };

    const sprites: unknown[] = [
        // await resizeImage("https://static.wikia.nocookie.net/minecraftpocketedition/images/e/e1/Red_Mushroom.png", vec2(8, 8))
        await resizeImage(mushroomImage, vec2(16, 16))
            .then((url) =>
            {
                return new Promise((resolve, reject) =>
                {
                    const tex = loader.load(url as string, () =>
                    {
                        console.log("Loaded texture");
                        addPreview(tex);
                        resolve(tex);
                    });
                });
            }),
    ];

    {
        const material = new THREE.MeshBasicMaterial({
            map: sprites[0] as THREE.Texture,
            side: THREE.DoubleSide,
            alphaTest: 0.1,
            transparent: false,
        });
        const geometry = new THREE.PlaneGeometry(cellSize, cellSize);
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(cellSize / 2, cellSize / 2, 0);

        const mesh2 = mesh.clone();
        mesh2.rotateOnAxis(new THREE.Vector3(0, 1, 0), -Math.PI / 2);
        mesh2.position.set(0, cellSize / 2, cellSize / 2);

        scene.add(mesh);
        scene.add(mesh2);
    }

    const axis = new THREE.AxesHelper(5);
    axis.position.set(0, 16, 0);
    scene.add(axis);


    addSun(scene, 4, 8, 4, deg2rad(0), 0, kelvinRGB(4200), 3.0);

    addLight(scene, -1, 5, 4, kelvinRGB(2000), 100.0);
    addLight(scene, cellSize/4, 1, -2, kelvinRGB(2200), 100.0);

    const ambientLight = new THREE.AmbientLight(kelvinRGB(6000), 0.2);
    scene.add(ambientLight);


    const world = new VoxelWorld({
        cellSize,
        tileSize,
        tileTextureWidth,
        tileTextureHeight,
    });

    const material = new THREE.MeshLambertMaterial({
        map: texture,
        side: THREE.DoubleSide,
        alphaTest: 0,
        transparent: false,
    });

    {
        const sprite = sprites[0] as THREE.Texture;

        const atlas = new BasicAtlas(32);
        const pixels = new PixelData(sprite.image, sprite.image.width, sprite.image.height);
        console.log(`atlas pixels: ${pixels.width}x${pixels.height}`);

        for (let y = 0; y < sprite.image.height; ++y) {
            for (let x = 0; x < sprite.image.width; ++x) {
                const color = pixels.get(x, y);
                if (color.a < 127) {
                    continue;
                }

                const c = packColor24(color.r, color.g, color.b);

                atlas.addColor(c);
            }
        }
        const image = atlas.build();
        addPreviewImage(image);

        const tex = new THREE.Texture(image);
        tex.magFilter = THREE.NearestFilter;
        tex.minFilter = THREE.NearestFilter;
        tex.needsUpdate = true;
        material.map = tex;
    }

    const cellIdToMesh = {};
    function updateCellGeometry(x: number, y: number, z: number)
    {
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

        const { positions, normals, uvs, indices } = world.generateGeometryDataForCell(cellX, cellY, cellZ);
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
        [0, 0, 0], // self
        [-1, 0, 0], // left
        [1, 0, 0], // right
        [0, -1, 0], // down
        [0, 1, 0], // up
        [0, 0, -1], // back
        [0, 0, 1], // front
    ];
    function updateVoxelGeometry(x: number, y: number, z: number)
    {
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

    const center = cellSize / 2;
    const centerSqr = center * center;

    const _img = (sprites[0] as THREE.Texture).image;

    const pixels = new PixelData(_img, _img.width, _img.height);
    pixels.prepareImageData();

    for (const { x,y,z,data } of world.enumerateVoxels()) {
        const color = sampleSide(pixels, Side.EAST, x, y + 1, z);
        const color2 = sampleSide(pixels, Side.NORTH, x, y + 1, z);
        if (color == null && color2 == null) {
            continue;
        }

        const ex = (color?.a || 0) & (color2?.a || 0);

        if (ex > 127) {
            world.setVoxel(x, y, z, randInt(1, 17));
        }
    }

    updateVoxelGeometry(1, 1, 1);  // 0,0,0 will generate

    console.log(`Estimated memory size: ${world.estimateMemorySize()}`);



    ////////////////////////////////////////////////////////////////////////////////


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


    let renderRequested = false;

    function render()
    {
        renderRequested = false;

        const delta = clock.getDelta();
        const time = clock.getElapsedTime();

        if (resizeRendererToDisplaySize(renderer)) {
            const canvas = renderer.domElement;
            const aspect = canvas.clientWidth / canvas.clientHeight;
            camera.left = -1 * zoom * aspect;
            camera.right = 1 * zoom * aspect;
            camera.top = 1 * zoom;
            camera.bottom = -1 * zoom;
            // camera.aspect = canvas.clientWidth / canvas.clientHeight;
            camera.updateProjectionMatrix();
        }

        controls.update(delta);

        renderer.clear();
        renderer.render(scene, camera);

        viewHelper.render(renderer);

        requestAnimationFrame(render);
    }
    render();

    function requestRenderIfNotRequested()
    {
        if (!renderRequested) {
            renderRequested = true;
            requestAnimationFrame(render);
        }
    }


    function placeVoxel(event)
    {
        const pos = getMousePositionRelative(canvas, event);
        const x = (pos.x / canvas!.clientWidth) * 2 - 1;
        const y = (pos.y / canvas!.clientHeight) * -2 + 1;  // note we flip Y

        const start = new THREE.Vector3();
        const end = new THREE.Vector3();
        start.setFromMatrixPosition(camera.matrixWorld);
        end.set(x, y, 1).unproject(camera);

        const intersection = world.intersectRay(start, end);
        if (intersection) {
            const voxelId = event.shiftKey ? 0 : 0;
            // the intersection point is on the face. That means
            // the math imprecision could put us on either side of the face.
            // so go half a normal into the voxel if removing (currentVoxel = 0)
            // our out of the voxel if adding (currentVoxel  > 0)
            const pos = intersection.position.map((v, ndx) =>
            {
                return v + intersection.normal[ndx] * (voxelId > 0 ? 0.5 : -0.5);
            });
            world.setVoxel(pos[0], pos[1], pos[2], voxelId);
            updateVoxelGeometry(pos[0], pos[1], pos[2]);
            requestRenderIfNotRequested();
        }
    }

    const mouse = {
        x: 0,
        y: 0,
        moveX: 0,
        moveY: 0,
    };

    function recordStartPosition(event: MouseEvent | Touch)
    {
        mouse.x = event.clientX;
        mouse.y = event.clientY;
        mouse.moveX = 0;
        mouse.moveY = 0;
    }
    function recordMovement(event)
    {
        mouse.moveX += Math.abs(mouse.x - event.clientX);
        mouse.moveY += Math.abs(mouse.y - event.clientY);
    }
    function placeVoxelIfNoMovement(event)
    {
        if (mouse.moveX < 5 && mouse.moveY < 5) {
            placeVoxel(event);
        }
        window.removeEventListener("mousemove", recordMovement);
        window.removeEventListener("mouseup", placeVoxelIfNoMovement);
    }
    canvas.addEventListener("mousedown", (event: MouseEvent) =>
    {
        event.preventDefault();
        recordStartPosition(event);
        window.addEventListener("mousemove", recordMovement);
        window.addEventListener("mouseup", placeVoxelIfNoMovement);
    }, { passive: false });
    canvas.addEventListener("touchstart", (event: TouchEvent) =>
    {
        event.preventDefault();
        recordStartPosition(event.touches[0]);
    }, { passive: false });
    canvas.addEventListener("touchmove", (event: TouchEvent) =>
    {
        event.preventDefault();
        recordMovement(event.touches[0]);
    }, { passive: false });
    canvas.addEventListener("touchend", () =>
    {
        placeVoxelIfNoMovement({
            clientX: mouse.x,
            clientY: mouse.y,
        });
    });

    controls.addEventListener("update", requestRenderIfNotRequested);
    window.addEventListener("resize", requestRenderIfNotRequested);
}

main();
