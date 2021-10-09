import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls';
import { Geometry } from 'three/examples/jsm/deprecated/Geometry';

import { THREEJson } from './Types';
import { Config, EditorConfig } from './Config';
import { color } from './Color';
import { ContextMenu } from './ContextMenu';
import { Event } from './Event';
import { Exporter } from './Exporter';
import { Loader } from './Loader';
import { History, HistoryJson } from './History';
import { Settings, EditorSettings } from './Settings';
import { StencilPlane } from './StencilPlane';
import { EditorControls } from './controls/EditorControls';
import { ViewCubeControls } from './controls/ViewCubeControls';
import { Command } from './commands/Command';

export type TransformControlsMode = 'translate' | 'rotate' | 'scale';
export type Helper = THREE.CameraHelper | THREE.PointLightHelper | THREE.DirectionalLightHelper | THREE.SpotLightHelper | THREE.HemisphereLightHelper | THREE.SkeletonHelper;

export interface EditorJson extends THREEJson {
  camera: Record<string, unknown>;
  scene: THREE.Scene;
  history: HistoryJson;
}

export class Editor {
  config: Config;
  settings: Settings;
  editorControls: EditorControls;
  renderer: THREE.WebGLRenderer;
  DEFAULT_CAMERA: THREE.Camera;
  history: History;
  exporter: Exporter;
  loader: Loader;
  camera: THREE.Camera;
  scene: THREE.Scene;
  sceneHelpers: THREE.Scene;
  objects: THREE.Object3D[];
  INITIAL_OBJECTS: THREE.Object3D[];
  INITIAL_HELPERS: THREE.Object3D[];
  geometries: { [index: string]: Geometry | THREE.BufferGeometry };
  materials: { [index: string]: THREE.Material };
  textures: { [index: string]: THREE.Texture };
  materialsRefCounter: Map<THREE.Material, number>;
  animations: { [index: string]: THREE.AnimationClip[] };
  mixer: THREE.AnimationMixer;
  selected: THREE.Object3D | null;
  hovered: THREE.Object3D | null;
  helpers: { [index: string]: Helper };
  cameras: { [index: string]: THREE.Camera };
  viewportCamera: THREE.Camera;
  orbitControls: OrbitControls;
  viewCubeControls: ViewCubeControls;
  gridHelper: THREE.GridHelper;
  axesHelper: THREE.AxesHelper;
  planeHelper: THREE.PlaneHelper;
  stencilPlane: StencilPlane;
  box: THREE.Box3;
  selectionBox: THREE.BoxHelper;
  transformControls: TransformControls;
  raycaster: THREE.Raycaster;
  mouse: THREE.Vector2;
  contextMenu: ContextMenu;
  event: Event;

  constructor(config?: EditorConfig, settings?: EditorSettings) {
    this.config = new Config(config);
    this.settings = new Settings(settings);
    this.editorControls = new EditorControls();
    this.renderer = this.settings.renderer;
    this.DEFAULT_CAMERA = this.settings.camera;
    this.camera = this.DEFAULT_CAMERA.clone();
    this.history = new History(this);
    this.exporter = new Exporter(this);
    this.loader = new Loader(this);
    this.scene = this.settings.scene;
    this.sceneHelpers = new THREE.Scene();
    this.objects = [];
    this.geometries = {};
    this.materials = {};
    this.textures = {};
    this.materialsRefCounter = new Map();
    this.animations = {};
    this.mixer = new THREE.AnimationMixer(this.scene);
    this.selected = null;
    this.hovered = null;
    this.helpers = {};
    this.cameras = {};
    this.viewportCamera = this.camera;
    this.orbitControls = new OrbitControls(this.camera, this.renderer.domElement);
    this.orbitControls.enabled = this.config.getKey('control/orbitControls/enable');
    this.viewCubeControls = new ViewCubeControls(this.config, this.camera);
    this.gridHelper = this.settings.gridHelper;
    this.sceneHelpers.add(this.gridHelper);
    this.axesHelper = this.settings.axesHelper;
    this.sceneHelpers.add(this.axesHelper);
    this.planeHelper = this.settings.planeHelper;
    this.sceneHelpers.add(this.planeHelper);
    this.stencilPlane = new StencilPlane(this.planeHelper.plane);
    this.scene.add(this.stencilPlane.stencilPlane);
    this.box = new THREE.Box3();
    const selectionBox = new THREE.BoxHelper(undefined as unknown as THREE.Object3D, color.selectionBox);
    (selectionBox.material as THREE.Material).depthTest = false;
    (selectionBox.material as THREE.Material).transparent = true;
    (selectionBox.material as THREE.Material).opacity = 0.7;
    selectionBox.visible = false;
    selectionBox.name = 'selectionBox';
    this.selectionBox = selectionBox;
    this.sceneHelpers.add(this.selectionBox);
    this.transformControls = new TransformControls(this.camera, this.renderer.domElement);
    this.transformControls.name = 'transformControls';
    this.sceneHelpers.add(this.transformControls);
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.contextMenu = new ContextMenu(this);
    this.event = new Event(this);
    this.addCamera(this.camera);
    this.INITIAL_OBJECTS = this.settings.initialObjects;
    this.INITIAL_HELPERS = this.settings.initialHelpers;
    this.INITIAL_OBJECTS.forEach(object => this.addObject(object));
    this.INITIAL_HELPERS.forEach(object => this.addObjectAsHelper(object));
  }

  setConfig(config: EditorConfig): void {
    // apply config
    this.config.set(config);

    // apply detail
    this.orbitControls.enabled = !!this.config.getKey('control/orbitControls/enable');
    this.transformControls.enabled = !!this.config.getKey('control/transformControls/enable');

    this.viewCubeControls.remove();
    this.viewCubeControls = new ViewCubeControls(this.config, this.camera);

    if (!this.config.getKey('select/enabled')) {
      this.select(null);
    }

    this.event.dispose();
    this.event = new Event(this);

    this.render();
  }

  private editorCleared(): void {
    this.orbitControls.target.set(0, 0, 0);
    this.render();
  }

  private objectSelected(object: THREE.Object3D | null): void {
    this.selectionBox.visible = false;
    this.transformControls.detach();

    if (object !== null && object !== this.scene && object !== this.camera) {
      this.box.setFromObject(object);

      if (this.box.isEmpty() === false) {
        this.selectionBox.setFromObject(object);
        this.selectionBox.visible = true;
      }

      this.transformControls.enabled && this.transformControls.attach(object);
    }

    this.render();
  }

  private objectFocused(target: THREE.Object3D): void {
    const delta = new THREE.Vector3();
    const center = this.orbitControls.target;
    const sphere = new THREE.Sphere();

    let distance;
    this.box.setFromObject(target);
    if (this.box.isEmpty() === false) {
      this.box.getCenter(center);
      distance = this.box.getBoundingSphere(sphere).radius;
    } else {
      center.setFromMatrixPosition(target.matrixWorld);
      distance = 0.1;
    }
    delta.set(0, 0, 1);
    delta.applyQuaternion(this.camera.quaternion);
    delta.multiplyScalar(distance * 4);
    this.camera.position.copy(center).add(delta);
    this.render();
  }

  objectChanged(object: THREE.Object3D): void {
    if (this.selected === object) {
      this.selectionBox.setFromObject(object);
    }

    if (object instanceof THREE.PerspectiveCamera) {
      object.updateProjectionMatrix();
    }

    if (this.helpers[object.id] !== undefined) {
      this.helpers[object.id].update();
    }

    this.editorControls.update();
    this.render();
  }

  private objectRemoved(object: THREE.Object3D): void {
    const objects = this.objects;
    this.orbitControls.enabled = true;
    if (object === this.transformControls.object) {
      this.transformControls.detach();
    }

    object.traverse((child) => {
      objects.splice(objects.indexOf(child), 1);
    });
  }

  private helperAdded(object: THREE.Object3D): void {
    const picker = object.getObjectByName('picker');
    picker && this.objects.push(picker);
  }

  private helperRemoved(object: THREE.Object3D): void {
    const picker = object.getObjectByName('picker');
    picker && this.objects.splice(this.objects.indexOf(picker), 1);
  }

  private viewportCameraChanged(viewportCamera: THREE.Camera): void {
    const camera = this.camera;
    viewportCamera.projectionMatrix.copy(camera.projectionMatrix);

    if (camera instanceof THREE.PerspectiveCamera && viewportCamera instanceof THREE.PerspectiveCamera) viewportCamera.aspect = camera.aspect;

    this.camera = viewportCamera;
    this.orbitControls = new OrbitControls(this.camera, this.renderer.domElement);

    this.render();
  }

  showGridChanged(showGrid: boolean): void {
    this.gridHelper.visible = showGrid;
    this.render();
  }

  render(): void {
    this.scene.updateMatrixWorld();
    this.renderer.render(this.scene, this.camera);
    this.sceneHelpers.updateMatrixWorld();
    this.renderer.render(this.sceneHelpers, this.camera);
  }

  setScene(scene: THREE.Scene): void {
    this.scene.uuid = scene.uuid;
    this.scene.name = scene.name;

    this.scene.background = scene.background !== null ? scene.background.clone() : null;

    if (scene.fog !== null) this.scene.fog = scene.fog.clone();

    this.scene.userData = JSON.parse(JSON.stringify(scene.userData));

    this.editorControls.enabled = false;

    while (scene.children.length > 0) {
      this.addObject(scene.children[0]);
    }

    this.editorControls.enabled = true;
    this.editorControls.update();
  }

  changeTransformMode(mode: TransformControlsMode): void {
    this.transformControls.enabled && this.transformControls.setMode(mode);
  }

  addObject(object: THREE.Object3D, parent?: THREE.Object3D, index?: number): void {
    const scope = this;
    object.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const geometry = child.geometry;
        const material = child.material;
        if (geometry) scope.addGeometry(geometry);
        if (material) scope.addMaterial(material);
      }

      if (child instanceof THREE.Camera) scope.addCamera(child);
      scope.addHelper(child);
    });

    if (!parent) {
      this.scene.add(object);
    } else {
      index = index || -1;
      parent.children.splice(index, 0, object);
      object.parent = parent;
    }

    object.traverse((child) => {
      scope.objects.push(child);
    });

    this.editorControls.update();
  }

  addObjectAsHelper(object: THREE.Object3D): void {
    if (object instanceof THREE.AxesHelper) {
      this.axesHelper = object;
    } else if (object instanceof THREE.GridHelper) {
      this.gridHelper = object;
    } else if (object instanceof THREE.PlaneHelper) {
      this.planeHelper = object;
    }

    this.sceneHelpers.add(object);
    this.editorControls.update();
  }

  moveObject(object: THREE.Object3D, parent?: THREE.Object3D, before?: THREE.Object3D): void {
    if (!parent) {
      parent = this.scene;
    }

    parent.add(object);

    // sort children array

    if (before) {
      const index = parent.children.indexOf(before);
      parent.children.splice(index, 0, object);
      parent.children.pop();
    }

    this.editorControls.update();
  }

  nameObject(object: THREE.Object3D, name: string): void {
    object.name = name;
    this.editorControls.update();
  }

  removeObject(object: THREE.Object3D): void {
    if (object.parent === null) return; // avoid deleting the camera or scene

    object.traverse((child) => {
      (child instanceof THREE.Camera) && this.removeCamera(child);
      this.removeHelper(child);

      const material = (child as THREE.Mesh).material;
      if (material) this.removeMaterial(material);
    });

    object.parent.remove(object);

    this.objectRemoved(object);
    this.editorControls.update();
  }

  addGeometry(geometry: Geometry | THREE.BufferGeometry): void {
    this.geometries[geometry.uuid] = geometry;
  }

  setGeometryName(geometry: Geometry | THREE.BufferGeometry, name: string): void {
    geometry.name = name;
    this.editorControls.update();
  }

  addMaterial(material: THREE.Material | THREE.Material[]): void {
    if (Array.isArray(material)) {
      for (let i = 0, l = material.length; i < l; i++) {
        this.addMaterialToRefCounter(material[i]);
      }
    } else {
      this.addMaterialToRefCounter(material);
    }

    // this.materialAdded();
  }

  addMaterialToRefCounter(material: THREE.Material): void {
    const materialsRefCounter = this.materialsRefCounter;

    let count = materialsRefCounter.get(material);

    if (count === undefined) {
      materialsRefCounter.set(material, 1);
      this.materials[material.uuid] = material;
    } else {
      count++;
      materialsRefCounter.set(material, count);
    }
  }

  removeMaterial(material: THREE.Material | THREE.Material[]): void {
    if (Array.isArray(material)) {
      for (let i = 0, l = material.length; i < l; i++) {
        this.removeMaterialFromRefCounter(material[i]);
      }
    } else {
      this.removeMaterialFromRefCounter(material);
    }

    // this.materialRemoved();
  }

  removeMaterialFromRefCounter(material: THREE.Material): void {
    const materialsRefCounter = this.materialsRefCounter;

    let count = materialsRefCounter.get(material);
    count && count--;

    if (count === 0) {
      materialsRefCounter.delete(material);
      delete this.materials[material.uuid];
    } else {
      count && materialsRefCounter.set(material, count);
    }
  }

  getMaterialById(id: number): THREE.Material | undefined {
    let material;
    const materials = Object.values(this.materials);

    for (let i = 0; i < materials.length; i++) {
      if (materials[i].id === id) {
        material = materials[i];
        break;
      }
    }

    return material;
  }

  setMaterialName(material: THREE.Material, name: string): void {
    material.name = name;
    this.editorControls.update();
  }

  addTexture(texture: THREE.Texture): void {
    this.textures[texture.uuid] = texture;
  }

  addAnimation(object: THREE.Object3D, animations: THREE.AnimationClip[]): void {
    if (animations.length > 0) {
      this.animations[object.uuid] = animations;
    }
  }

  addCamera(camera: THREE.Camera): void {
    if (camera.isCamera) {
      this.cameras[camera.uuid] = camera;

      // this.cameraAdded(camera);
    }
  }

  removeCamera(camera: THREE.Camera): void {
    if (this.cameras[camera.uuid] !== undefined) {
      delete this.cameras[camera.uuid];

      // this.cameraRemoved(camera);
    }
  }

  // Helpers
  addHelper(object: THREE.Object3D): void {
    let helper;

    if (object instanceof THREE.Camera) {
      helper = new THREE.CameraHelper(object);
    } else if (object instanceof THREE.PointLight) {
      helper = new THREE.PointLightHelper(object, 1);
    } else if (object instanceof THREE.DirectionalLight) {
      helper = new THREE.DirectionalLightHelper(object, 1);
    } else if (object instanceof THREE.SpotLight) {
      helper = new THREE.SpotLightHelper(object, 1);
    } else if (object instanceof THREE.HemisphereLight) {
      helper = new THREE.HemisphereLightHelper(object, 1);
    } else if (object instanceof THREE.SkinnedMesh) {
      helper = new THREE.SkeletonHelper(object.skeleton.bones[0]);
    } else {
      // no helper for this object type
      return;
    }

    const geometry = new THREE.SphereBufferGeometry(2, 4, 2);
    const material = new THREE.MeshBasicMaterial({ color: color.picker, visible: false });
    const picker = new THREE.Mesh(geometry, material);
    picker.name = 'picker';
    picker.userData.object = object;
    helper.add(picker);

    this.sceneHelpers.add(helper);
    this.helpers[object.id] = helper;

    this.helperAdded(helper);
  }

  removeHelper(object: THREE.Object3D): void {
    if (this.helpers[object.id] !== undefined) {
      const helper = this.helpers[object.id];
      helper.parent && helper.parent.remove(helper);

      delete this.helpers[object.id];

      this.helperRemoved(helper);
    }
  }

  updateGridHelper(gridHelper: THREE.GridHelper): void {
    this.gridHelper = gridHelper;
  }

  updateAxesHelper(axesHelper: THREE.AxesHelper): void {
    this.axesHelper = axesHelper;
  }

  updatePlaneHelper(planeHelper: THREE.PlaneHelper): void {
    this.planeHelper = planeHelper;
  }

  clip(enable = true): void {
    this.renderer.clippingPlanes = enable ? [this.planeHelper.plane] : [];
  }

  setDefaultCamera(): void {
    this.camera = this.DEFAULT_CAMERA.clone();
    this.viewportCamera = this.camera;
    this.viewportCameraChanged(this.viewportCamera);
  }

  setViewportCamera(uuid: string): void {
    this.viewportCamera = this.cameras[uuid];
    this.viewportCameraChanged(this.viewportCamera);
  }

  select(object: THREE.Object3D | null): void {
    const enabled = this.config.getKey('select/enabled');
    if (!enabled && object) return;
    if (object && this.selected === object) return;

    this.selected = object;

    this.objectSelected(object);
  }

  selectById(id: number): void {
    if (id === this.camera.id) {
      this.select(this.camera);
      return;
    }

    const object = this.scene.getObjectById(id);
    object && this.select(object);
  }

  selectByUuid(uuid: string): void {
    this.scene.traverse((child) => {
      if (child.uuid === uuid) {
        this.select(child);
      }
    });
  }

  setHovered(object: THREE.Object3D | null): void {
    if (object && this.hovered === object) return;

    this.hovered = object;
  }

  focus(object: THREE.Object3D): void {
    if (object !== undefined) {
      this.objectFocused(object);
    }
  }

  focusById(id: number): void {
    const object = this.scene.getObjectById(id);
    object && this.focus(object);
  }

  clear(): void {
    this.history.clear();

    this.camera.copy(this.DEFAULT_CAMERA);
    this.scene = this.settings.scene;
    const objects = this.scene.children;
    while (objects.length > 0) {
      this.removeObject(objects[0]);
    }

    this.geometries = {};
    this.materials = {};
    this.textures = {};

    this.materialsRefCounter.clear();

    this.animations = {};
    this.mixer.stopAllAction();

    this.select(null);

    this.editorCleared();
  }

  fromJSON(json: EditorJson): void {
    const loader = new THREE.ObjectLoader();
    const camera = loader.parse<THREE.Camera>(json.camera);

    this.camera.copy(camera);
    if (this.camera instanceof THREE.PerspectiveCamera && this.DEFAULT_CAMERA instanceof THREE.PerspectiveCamera) {
      this.camera.aspect = this.DEFAULT_CAMERA.aspect;
      this.camera.updateProjectionMatrix();
    }

    this.history.fromJSON(json.history as HistoryJson);

    loader.parse(json.scene, (scene) => {
      this.setScene(scene as THREE.Scene);
    });
  }

  toJSON(): EditorJson {
    return {
      metadata: {
        type: 'app',
      },
      camera: this.camera.toJSON(),
      scene: this.scene.toJSON(),
      history: this.history.toJSON(),
    };
  }

  objectByUuid(uuid: string | undefined): THREE.Object3D | undefined {
    if (!uuid) return undefined;
    return this.scene.getObjectByProperty('uuid', uuid);
  }

  execute(cmd: Command): void {
    this.history.execute(cmd);
  }

  undo(): void {
    if (this.config.getKey('undo/enabled')) {
      this.history.undo();
    }
  }

  redo(): void {
    if (this.config.getKey('redo/enabled')) {
      this.history.redo();
    }
  }
}
