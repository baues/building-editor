/* eslint-disable @typescript-eslint/no-var-requires */
import * as THREE from 'three';
import { defaultSettings } from './defaultSettings';

try {
  // eslint-disable-next-line no-var
  var { besettings } = require('besettings');
} catch (e) {}

export interface BuildingEditorSettings {
  renderer: THREE.WebGLRenderer;
  camera: THREE.Camera;
  scene: THREE.Scene;
  gridHelper: THREE.GridHelper;
  axesHelper: THREE.AxesHelper;
  planeHelper: THREE.PlaneHelper;
  initialObjects: THREE.Object3D[];
  initialHelpers: THREE.Object3D[];
}

export type EditorSettings = Partial<BuildingEditorSettings>;

export class Settings {
  renderer: THREE.WebGLRenderer;
  camera: THREE.Camera;
  scene: THREE.Scene;
  gridHelper: THREE.GridHelper;
  axesHelper: THREE.AxesHelper;
  planeHelper: THREE.PlaneHelper;
  initialObjects: THREE.Object3D[];
  initialHelpers: THREE.Object3D[];

  constructor() {
    this.renderer = defaultSettings.renderer;
    this.camera = defaultSettings.camera;
    this.scene = defaultSettings.scene;
    this.gridHelper = defaultSettings.gridHelper;
    this.axesHelper = defaultSettings.axesHelper;
    this.planeHelper = defaultSettings.planeHelper;
    this.initialObjects = defaultSettings.initialObjects;
    this.initialHelpers = defaultSettings.initialHelpers;

    if (besettings) {
      Object.assign(this, besettings);
    }
  }
}
