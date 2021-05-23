import * as THREE from 'three';
import { color } from './Color';
import { BuildingEditorSettings } from './Settings';

// renderer
const renderer = new THREE.WebGLRenderer({ alpha: true });
renderer.autoClear = false;
renderer.shadowMap.autoUpdate = false;
renderer.outputEncoding = THREE.sRGBEncoding;

// camera
const camera = new THREE.PerspectiveCamera(60, 1, 0.01, 10000);
camera.name = 'camera';
camera.position.set(0, 20, 50);
camera.lookAt(new THREE.Vector3());

// scene
const scene = new THREE.Scene();
scene.name = 'scene';
scene.background = new THREE.Color(color['scene/background']);

// gridHelper
const gridHelper = new THREE.GridHelper(100, 20, color.gridHelper);
gridHelper.name = 'gridHelper';

// axesHelper
const axesHelper = new THREE.AxesHelper(50);
axesHelper.name = 'axesHelper';

// planeHelper
const plane = new THREE.Plane(new THREE.Vector3(1, 0, 0), 0);
const planeHelper = new THREE.PlaneHelper(plane, 10, color.planeHelper);
planeHelper.renderOrder = 1;
planeHelper.visible = false;

export const defaultSettings: BuildingEditorSettings = {
  renderer,
  camera,
  scene,
  gridHelper,
  axesHelper,
  planeHelper,
  initialObjects: [],
  initialHelpers: [],
};
