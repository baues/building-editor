# Building Editor

The goal of this project is to provide base implementation of web 3D editor for building/architecture which can be used easily. The codes are based on [three.js](https://github.com/mrdoob/three.js) editor fork, as we respect the great work of three.js.

> Note: This project is under development. Please remember that there would be breaking changes. Or you can join us to make this package better for users.

## Installation

```
npm install building-editor
```

## Usage

```js
import { Editor } from 'building-editor';

const editor = new Editor();
document.body.appendChild(editor.renderer.domElement);

const onChange = () => {
  editor.render();
};

const init = () => {
  const width = window.innerWidth;
  const height = window.innerHeight;
  editor.renderer.setPixelRatio(window.devicePixelRatio);
  editor.renderer.setSize(width, height);
  editor.render();
}

init();
editor.orbitControls.addEventListener('change', onChange);
```

## API

### Editor

The main API of this library to create web 3D editor. This includes properties and actions. Note that you need to implement user interactions such as selected, hovered etc., using addEventListener since Editor itself does not provide it.

#### Constructor

##### Editor()

This creates a new Editor. It also applies [besettings](#besettings).

#### Properties and Methods

Editor has many properties and methods. Please check [Editor class](https://github.com/baues/building-editor/blob/master/src/Editor.ts) to find them. The documents will be prepared later.

### besettings

`besettings` define initial editor settings. [Editor](#Editor) will automatically configure the file named `besettings.js(.ts)` in the root of your project and import variable named `besettings`. Provide your own `besettings` to initialize editor. You can use built-in type `EditorSettings` for typescript project.

#### Code Example

```ts
// besettings.ts
import * as THREE from 'three';
import { EditorSettings } from 'building-editor';

// renderer
const renderer = new THREE.WebGLRenderer({ alpha: true });
renderer.autoClear = false;
renderer.shadowMap.autoUpdate = false;
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.localClippingEnabled = true;
renderer.setPixelRatio(window.devicePixelRatio);

// camera
const camera = new THREE.PerspectiveCamera(60, 1, 0.01, 10000);
camera.name = 'camera';
camera.position.set(0, 20, 50);
camera.lookAt(new THREE.Vector3());

// scene
const scene = new THREE.Scene();
scene.name = 'scene';
scene.background = new THREE.Color(0xffffff);

// gridHelper
const gridHelper = new THREE.GridHelper(100, 20, 0x666666);
gridHelper.name = 'gridHelper';

// axesHelper
const axesHelper = new THREE.AxesHelper(50);
axesHelper.name = 'axesHelper';
const axesColor = axesHelper.geometry.attributes.color;
const axesColorIndex = 0.8;
axesColor.setXYZ(0, axesColorIndex, 0, 0); // index, R, G, B
axesColor.setXYZ(1, axesColorIndex, 0, 0); // red
axesColor.setXYZ(2, 0, axesColorIndex, 0);
axesColor.setXYZ(3, 0, axesColorIndex, 0); // green
axesColor.setXYZ(4, 0, 0, axesColorIndex);
axesColor.setXYZ(5, 0, 0, axesColorIndex); // blue

// planeHelper
export const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const planeHelper = new THREE.PlaneHelper(plane, 100, 0x999999);
planeHelper.name = 'planeHelper';
planeHelper.renderOrder = 1;
planeHelper.visible = false;

// initialObject
const initialObject = new THREE.Group();
initialObject.name = 'initialObject';

const light = new THREE.AmbientLight(0xffffff);
light.name = 'ambientLight';
initialObject.add(light);

export const besettings: EditorSettings = {
  renderer,
  camera,
  scene,
  gridHelper,
  axesHelper,
  planeHelper,
  initialObjects: [initialObject],
};
```


