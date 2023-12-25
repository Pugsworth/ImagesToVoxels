# About
This project utilizes Three.js and a tiny voxel "engine" to produce 3D models from 2D images. The project is very early states. Just a proof of concept. The goal is to be able to take 1-6 images on each side of a cube and use that to perform a 3D reconstruction of the object.

# Inspiration
This seems like a really simple tool that should have already existed in multiple different forms. Apparently not...
So, I took it upon myself to create it.
This won't be a fully-featured tool as the bikeshedding is too strong already.

# Usage
Run `npm run watch` to start the dev server. If a browser window doesn't automatically open to the correct URL, then navigate to `localhost:1234` in your browser.
For right now, there's no functionality within the browser. It just acts like a viewer.
In the future, I'll have controls for uploading the images for which faces and methods for selecting and exporting the model.

# Roadmap
### MVP
- [ ] Generate a color palette and texture atlas from that palette of the input image.
    This palette will be used for the texturing of the 3D model.
- [ ] Ability to select individual meshes that are generated from the input images.
    This includes a shader to highlight the selected mesh.
- [ ] Export the model as a simple file format.
- [ ] Directional widget.

### Planned Features
- [ ] Ability to draw-n-drop images to the sides of the cube, as well as a way to move them around and delete them.
- [ ] Ability to export a voxel model instead of a mesh.
- [ ] UI for modifying settings like the voxel space, and other stuff I will think of later.

### Nice-to-haves
- [ ] Paint directly on the faces of the cube to modify the textures on those faces.
- [ ] Modify the voxel space directly.
- [ ] Display an animation for how the voxel space is generated. (Display which pixel on each face is currently being processed and where in 3D space it is)


### Technical
- I have the concept of "sides" in the voxel space which represent cardinal directions. This should be fleshed out and aligned with the coordinate system Three.js uses. Currently, +X is North, +Y is Up, and +Z is East.
- I need to flesh out the texture atlas class and creation.
- The voxel space implementation is based on the sample code for voxel worlds in the Three.js examples in the documentation. This definitely needs to be reorganized and cleaned up.
- State should be saved in the browser. Not sure what state should even be considered for saving, though. This also means a save/load system needs to be implemented.
- Currently, the voxel space is somewhat static. There exists the functionality to remove voxels and regenerate the mesh, but it's still from the example code. There might be the feature in the future to modify the 3D model before exportation, but that's not a planned feature.