import * as THREE from 'three';
import { AMFLoader } from 'three/examples/jsm/loaders/AMFLoader';
import { ColladaLoader } from 'three/examples/jsm/loaders/ColladaLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { KMZLoader } from 'three/examples/jsm/loaders/KMZLoader';
import { MD2Loader } from 'three/examples/jsm/loaders/MD2Loader';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader';
import { TDSLoader } from 'three/examples/jsm/loaders/TDSLoader';
import { VTKLoader } from 'three/examples/jsm/loaders/VTKLoader';
import { VRMLLoader } from 'three/examples/jsm/loaders/VRMLLoader';
import { AddObjectCommand } from './commands/AddObjectCommand';
import { SetSceneCommand } from './commands/SetSceneCommand';
import { Editor, EditorJson } from './Editor';
import { THREEJson } from './Types';

type FilesMap = {[index: string]: File};

export function createFilesMap(files: File[]): FilesMap {
  const map: FilesMap = {};

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    map[file.name] = file;
  }

  return map;
}

export function getFilesFromItemList(items: DataTransferItem[], onDone: (files: File[], filesMap?: FilesMap) => void): void {
  let itemsCount = 0;
  let itemsTotal = 0;

  const files: File[] = [];
  const filesMap: FilesMap = {};

  function onEntryHandled(): void {
    itemsCount++;

    if (itemsCount === itemsTotal) {
      onDone(files, filesMap);
    }
  }

  function handleEntry(entry: any): void {
    if (entry?.isDirectory) {
      const reader = entry.createReader();
      reader.readEntries((entries: any) => {
        for (let i = 0; i < entries.length; i++) {
          handleEntry(entries[i]);
        }

        onEntryHandled();
      });
    } else if (entry?.isFile) {
      entry.file((file: any) => {
        files.push(file);

        filesMap[entry.fullPath.substr(1)] = file;
        onEntryHandled();
      });
    }

    itemsTotal++;
  }

  for (let i = 0; i < items.length; i++) {
    handleEntry(items[i].webkitGetAsEntry());
  }
}

class Loader {
  editor: Editor;
  texturePath: string;

  constructor(editor: Editor) {
    this.editor = editor;
    this.texturePath = '';
  }

  loadItemList(items: DataTransferItem[]): void {
    const scope = this;
    getFilesFromItemList(items, (files: File[], filesMap?: FilesMap) => {
      scope.loadFiles(files, filesMap);
    });
  }

  loadFiles(files: File[], filesMap?: FilesMap, parent?: THREE.Object3D, onLoad?: (object: THREE.Object3D | undefined) => void, onError?: (error: any) => void): void {
    if (files.length > 0) {
      filesMap = filesMap || createFilesMap(files);
      const manager = new THREE.LoadingManager();
      manager.setURLModifier((url) => {
        const file = (filesMap as FilesMap)[url];
        if (file) {
          console.log('Loading', url);
          return URL.createObjectURL(file);
        }
        return url;
      });
      for (let i = 0; i < files.length; i++) {
        this.loadFile(files[i], manager, parent, onLoad, onError);
      }
    }
  }

  loadFile(file: File, manager?: THREE.LoadingManager, parent?: THREE.Object3D, onLoad?: (object: THREE.Object3D | undefined, file: File) => void, onError?: (error: any) => void): void {
    const editor = this.editor;
    const filename = file.name;
    const extension = filename.split('.').pop()?.toLowerCase();
    const reader = new FileReader();
    const throwError = (e: any) => {
      if (editor.config.getKey('debug')) console.error('Failed to read file.' + reader.error ? reader.error : e);
      reader.abort();
      onError && onError(e);
    };

    reader.addEventListener('progress', (event) => {
      const size = '(' + Math.floor(event.total / 1000).toString() + ' KB)';
      const progress = Math.floor((event.loaded / event.total) * 100) + '%';
      console.log('Loading', filename, size, progress);
    });

    reader.addEventListener('error', (event) => {
      throwError(event);
    });

    switch (extension) {
      case '3ds':
        reader.addEventListener('load', (event) => {
          try {
            const contents = event.target?.result as ArrayBuffer;
            const loader = new TDSLoader(manager);
            const object = loader.parse(contents, '');
            editor.execute(new AddObjectCommand(editor, object, parent));
            onLoad && onLoad(object, file);
          } catch (e) {
            throwError(e);
          }
        }, false);
        reader.readAsArrayBuffer(file);
        break;
      case 'amf':
        reader.addEventListener('load', (event) => {
          try {
            const contents = event.target?.result as ArrayBuffer;
            const loader = new AMFLoader(manager);
            const amfobject = loader.parse(contents);
            editor.execute(new AddObjectCommand(editor, amfobject, parent));
            onLoad && onLoad(amfobject, file);
          } catch (e) {
            throwError(e);
          }
        }, false);
        reader.readAsArrayBuffer(file);
        break;
      case 'dae':
        reader.addEventListener('load', (event) => {
          try {
            const contents = event.target?.result as string;
            const loader = new ColladaLoader(manager);
            const collada = loader.parse(contents, '');
            collada.scene.name = filename;
            editor.execute(new AddObjectCommand(editor, collada.scene, parent));
            onLoad && onLoad(collada.scene, file);
          } catch (e) {
            throwError(e);
          }
        }, false);
        reader.readAsText(file);
        break;
      case 'fbx':
        reader.addEventListener('load', (event) => {
          try {
            const contents = event.target?.result as ArrayBuffer | string;
            const loader = new FBXLoader(manager);
            const object = loader.parse(contents, '') as any;
            editor.addAnimation(object, object.animations);
            editor.execute(new AddObjectCommand(editor, object, parent));
            onLoad && onLoad(object, file);
          } catch (e) {
            throwError(e);
          }
        }, false);
        reader.readAsArrayBuffer(file);
        break;
      case 'glb':
        reader.addEventListener('load', (event) => {
          try {
            const contents = event.target?.result as ArrayBuffer;
            const dracoLoader = new DRACOLoader(manager);
            dracoLoader.setDecoderPath('three/examples/js/libs/draco/gltf/draco_decoder');
            const loader = new GLTFLoader();
            loader.setDRACOLoader(dracoLoader);
            loader.parse(contents, '', (result) => {
              const scene = result.scene;
              scene.name = filename;
              editor.addAnimation(scene, result.animations);
              editor.execute(new AddObjectCommand(editor, scene, parent));
              onLoad && onLoad(scene, file);
            });
          } catch (e) {
            throwError(e);
          }
        }, false);
        reader.readAsArrayBuffer(file);
        break;
      case 'gltf':
        reader.addEventListener('load', (event) => {
          try {
            const contents = event.target?.result as ArrayBuffer;
            let loader;
            if (this._isGLTF1(contents)) {
              alert('Import of glTF asset not possible. Only versions >= 2.0 are supported. Please try to upgrade the file to glTF 2.0 using glTF-Pipeline.');
            } else {
              const dracoLoader = new DRACOLoader(manager);
              dracoLoader.setDecoderPath('three/examples/js/libs/draco/gltf/draco_decoder');
              loader = new GLTFLoader(manager);
              loader.setDRACOLoader(dracoLoader);
            }
            loader && loader.parse(contents, '', (result) => {
              const scene = result.scene;
              scene.name = filename;
              editor.addAnimation(scene, result.animations);
              editor.execute(new AddObjectCommand(editor, scene, parent));
              onLoad && onLoad(scene, file);
            });
          } catch (e) {
            throwError(e);
          }
        }, false);
        reader.readAsArrayBuffer(file);
        break;
      case 'js':
      case 'json':
      case '3geo':
      case '3mat':
      case '3obj':
      case '3scn':
        reader.addEventListener('load', (event) => {
          try {
            const contents = event.target?.result as any;
            // 2.0
            if (contents.indexOf('postMessage') !== -1) {
              const blob = new Blob([contents], { type: 'text/javascript' });
              const url = URL.createObjectURL(blob);
              const worker = new Worker(url);
              worker.onmessage = (event) => {
                event.data.metadata = { version: 2 };
                this._handleJSON(event.data, file, manager, parent);
              };
              worker.postMessage(Date.now());
              return;
            }
            // >= 3.0
            const data = JSON.parse(contents);
            this._handleJSON(data, file, manager, parent, onLoad);
          } catch (e) {
            throwError(e);
          }
        }, false);
        reader.readAsText(file);
        break;
      case 'kmz':
        reader.addEventListener('load', (event) => {
          try {
            const contents = event.target?.result as ArrayBuffer;
            const loader = new KMZLoader(manager);
            const collada = loader.parse(contents);
            collada.scene.name = filename;
            editor.execute(new AddObjectCommand(editor, collada.scene, parent));
            onLoad && onLoad(collada.scene, file);
          } catch (e) {
            throwError(e);
          }
        }, false);
        reader.readAsArrayBuffer(file);
        break;
      case 'md2':
        reader.addEventListener('load', (event) => {
          try {
            const contents = event.target?.result as ArrayBuffer;
            const geometry = new MD2Loader(manager).parse(contents) as any;
            const material = new THREE.MeshStandardMaterial({
              morphTargets: true,
              morphNormals: true,
            });
            const mesh = new THREE.Mesh(geometry, material) as any;
            mesh.mixer = new THREE.AnimationMixer(mesh);
            mesh.name = filename;
            editor.addAnimation(mesh, geometry.animations);
            editor.execute(new AddObjectCommand(editor, mesh, parent));
            onLoad && onLoad(mesh, file);
          } catch (e) {
            throwError(e);
          }
        }, false);
        reader.readAsArrayBuffer(file);
        break;
      case 'obj':
        reader.addEventListener('load', (event) => {
          try {
            const contents = event.target?.result as string;
            const object = new OBJLoader(manager).parse(contents);
            object.name = filename;
            editor.execute(new AddObjectCommand(editor, object, parent));
            onLoad && onLoad(object, file);
          } catch (e) {
            throwError(e);
          }
        }, false);
        reader.readAsText(file);
        break;
      case 'ply':
        reader.addEventListener('load', (event) => {
          try {
            const contents = event.target?.result as ArrayBuffer | string;
            const geometry = new PLYLoader(manager).parse(contents) as any;
            geometry.sourceType = 'ply';
            geometry.sourceFile = file.name;
            const material = new THREE.MeshStandardMaterial();
            const mesh = new THREE.Mesh(geometry, material);
            mesh.name = filename;
            editor.execute(new AddObjectCommand(editor, mesh, parent));
            onLoad && onLoad(mesh, file);
          } catch (e) {
            throwError(e);
          }
        }, false);
        reader.readAsArrayBuffer(file);
        break;
      case 'stl':
        reader.addEventListener('load', (event) => {
          try {
            const contents = event.target?.result as ArrayBuffer;
            const geometry = new STLLoader(manager).parse(contents) as any;
            geometry.sourceType = 'stl';
            geometry.sourceFile = file.name;
            const material = new THREE.MeshStandardMaterial();
            const mesh = new THREE.Mesh(geometry, material);
            mesh.name = filename;
            editor.execute(new AddObjectCommand(editor, mesh, parent));
            onLoad && onLoad(mesh, file);
          } catch (e) {
            throwError(e);
          }
        }, false);
        if (reader.readAsBinaryString !== undefined) {
          reader.readAsBinaryString(file);
        } else {
          reader.readAsArrayBuffer(file);
        }
        break;
      case 'svg':
        reader.addEventListener('load', (event) => {
          try {
            const contents = event.target?.result as string;
            const loader = new SVGLoader(manager);
            const paths = loader.parse(contents).paths;
            //
            const group = new THREE.Group();
            group.scale.multiplyScalar(0.1);
            group.scale.y *= -1;
            for (let i = 0; i < paths.length; i++) {
              const path = paths[i] as any;
              const material = new THREE.MeshBasicMaterial({
                color: path.color,
                depthWrite: false,
              });
              const shapes = path.toShapes(true);
              for (let j = 0; j < shapes.length; j++) {
                const shape = shapes[j];
                const geometry = new THREE.ShapeBufferGeometry(shape);
                const mesh = new THREE.Mesh(geometry, material);
                group.add(mesh);
              }
            }
            editor.execute(new AddObjectCommand(editor, group, parent));
            onLoad && onLoad(group, file);
          } catch (e) {
            throwError(e);
          }
        }, false);
        reader.readAsText(file);
        break;
      case 'vtk':
        reader.addEventListener('load', (event) => {
          try {
            const contents = event.target?.result as ArrayBuffer;
            const geometry = new VTKLoader(manager).parse(contents, '') as any;
            geometry.sourceType = 'vtk';
            geometry.sourceFile = file.name;
            const material = new THREE.MeshStandardMaterial();
            const mesh = new THREE.Mesh(geometry, material);
            mesh.name = filename;
            editor.execute(new AddObjectCommand(editor, mesh, parent));
            onLoad && onLoad(mesh, file);
          } catch (e) {
            throwError(e);
          }
        }, false);
        reader.readAsText(file);
        break;
      case 'wrl':
        reader.addEventListener('load', (event) => {
          try {
            const contents = event.target?.result as string;
            const result = new VRMLLoader(manager).parse(contents, '');
            editor.execute(new SetSceneCommand(editor, result));
            onLoad && onLoad(result, file);
          } catch (e) {
            throwError(e);
          }
        }, false);
        reader.readAsText(file);
        break;
      default:
        throwError('Unsupported file format (' + extension + ').');
        break;
    }
  }

  private _handleJSON(
    data: THREEJson,
    file: File,
    manager?: THREE.LoadingManager,
    parent?: THREE.Object3D,
    onLoad?: (object: THREE.Object3D | undefined, file: File) => void,
  ): void {
    const editor = this.editor;
    const texturePath = this.texturePath;
    if (data.metadata === undefined) {
      // 2.0
      data.metadata = { type: 'Geometry' };
    }
    if (data.metadata.type === undefined) {
      // 3.0
      data.metadata.type = 'Geometry';
    }
    if (data.metadata.formatVersion !== undefined) {
      data.metadata.version = data.metadata.formatVersion;
    }
    let loader;
    switch (data.metadata.type.toLowerCase()) {
      case 'buffergeometry':
        loader = new THREE.BufferGeometryLoader(manager);
        const result = loader.parse(data);
        const mesh = new THREE.Mesh(result);
        editor.execute(new AddObjectCommand(editor, mesh, parent));
        onLoad && onLoad(mesh, file);
        break;
      case 'geometry':
        console.error('Loader: "Geometry" is no longer supported.');
        break;
      case 'object':
        loader = new THREE.ObjectLoader();
        loader.setResourcePath(texturePath);
        loader.parse(data, (result) => {
          if (result instanceof THREE.Scene) {
            editor.execute(new SetSceneCommand(editor, result));
            onLoad && onLoad(result, file);
          } else {
            editor.execute(new AddObjectCommand(editor, result, parent));
            onLoad && onLoad(result, file);
          }
        });
        break;
      case 'app':
        editor.fromJSON(data as EditorJson);
        break;
      default:
        break;
    }
  }

  private _isGLTF1(contents: string | ArrayBufferLike): boolean {
    let resultContent;
    if (typeof contents === 'string') {
      // contents is a JSON string
      resultContent = contents;
    } else {
      const magic = THREE.LoaderUtils.decodeText(new Uint8Array(contents, 0, 4));
      if (magic === 'glTF') {
        // contents is a .glb file; extract the version
        const version = new DataView(contents).getUint32(4, true);
        return version < 2;
      } else {
        // contents is a .gltf file
        resultContent = THREE.LoaderUtils.decodeText(new Uint8Array(contents));
      }
    }
    const json = JSON.parse(resultContent);
    return json.asset !== undefined && json.asset.version[0] < 2;
  }
}

export { Loader };
