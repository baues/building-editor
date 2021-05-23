import * as THREE from 'three';
import { ColladaExporter } from 'three/examples/jsm/exporters/ColladaExporter';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter';
import { OBJExporter } from 'three/examples/jsm/exporters/OBJExporter';
import { PLYExporter } from 'three/examples/jsm/exporters/PLYExporter';
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter';
import { Editor } from './Editor';

export class Exporter {
  editor: Editor;
  link: HTMLAnchorElement;

  constructor(editor: Editor) {
    this.editor = editor;
    this.link = document.createElement('a');
    this.link.style.display = 'none';
  }

  parseNumber(key: any, value: number): number {
    const precision = this.editor.config.getKey('exportPrecision');

    return typeof value === 'number' ? parseFloat(value.toFixed(precision)) : value;
  }

  // Export Geometry
  exportGeometry(): void {
    const object = this.editor.selected;

    if (object === null) {
      alert('No object selected.');
      return;
    }

    if (!(object instanceof THREE.Mesh)) return;

    const geometry = object.geometry;

    if (geometry === undefined) {
      alert("The selected object doesn't have geometry.");
      return;
    }

    let output = geometry.toJSON();

    try {
      output = JSON.stringify(output, this.parseNumber, '\t');
      output = output.replace(/[\n\t]+([\d.e\-[\]]+)/g, '$1');
    } catch (e) {
      output = JSON.stringify(output);
    }

    this.saveString(output, 'geometry.json');
  }

  // Export Object
  exportObject(): void {
    const object = this.editor.selected;

    if (object === null) {
      alert('No object selected');
      return;
    }

    let output = object.toJSON();

    try {
      output = JSON.stringify(output, this.parseNumber, '\t');
      output = output.replace(/[\n\t]+([\d.e\-[\]]+)/g, '$1');
    } catch (e) {
      output = JSON.stringify(output);
    }

    this.saveString(output, 'model.json');
  }

  // Export Scene
  exportScene(): void {
    let output = this.editor.scene.toJSON();

    try {
      output = JSON.stringify(output, this.parseNumber, '\t');
      output = output.replace(/[\n\t]+([\d.e\-[\]]+)/g, '$1');
    } catch (e) {
      output = JSON.stringify(output);
    }

    this.saveString(output, 'scene.json');
  }

  // Export DAE
  exportDAE(): void {
    const scope = this;
    const exporter = new ColladaExporter();

    exporter.parse(scope.editor.scene, (result) => {
      scope.saveString(result.data, 'scene.dae');
    }, {});
  }

  // Export GLB
  exportGLB(): void {
    const scope = this;
    const exporter = new GLTFExporter();

    exporter.parse(
      scope.editor.scene,
      (result) => {
        scope.saveArrayBuffer(result as BlobPart, 'scene.glb');

        // forceIndices: true, forcePowerOfTwoTextures: true
        // to allow compatibility with facebook
      },
      { binary: true, forceIndices: true, forcePowerOfTwoTextures: true },
    );
  }

  // Export GLTF
  exportGLTF(): void {
    const scope = this;
    const exporter = new GLTFExporter();

    exporter.parse(scope.editor.scene, (result) => {
      scope.saveString(JSON.stringify(result, null, 2), 'scene.gltf');
    }, {});
  }

  // Export OBJ
  exportOBJ(): void {
    const scope = this;
    const object = scope.editor.selected;

    if (object === null) {
      alert('No object selected.');
      return;
    }

    const exporter = new OBJExporter();

    scope.saveString(exporter.parse(object), 'model.obj');
  }

  // Export PLY (ASCII)
  exportPLY(): void {
    const scope = this;
    const exporter = new PLYExporter();

    exporter.parse(scope.editor.scene, (result) => {
      scope.saveArrayBuffer(result, 'model.ply');
    }, {});
  }

  // Export PLY (Binary)
  exportBinaryPLY(): void {
    const scope = this;
    const exporter = new PLYExporter();

    exporter.parse(
      scope.editor.scene,
      (result) => {
        scope.saveArrayBuffer(result, 'model-binary.ply');
      },
      { binary: true },
    );
  }

  // Export STL (ASCII)

  exportSTL(): void {
    const scope = this;
    const exporter = new STLExporter();

    scope.saveString(exporter.parse(scope.editor.scene), 'model.stl');
  }

  // Export STL (Binary)

  exportBinarySTL(): void {
    const scope = this;
    const exporter = new STLExporter();

    scope.saveArrayBuffer(exporter.parse(scope.editor.scene, { binary: true }), 'model-binary.stl');
  }

  save(blob: Blob, filename: string): void {
    this.link.href = URL.createObjectURL(blob);
    this.link.download = filename || 'data.json';
    this.link.dispatchEvent(new MouseEvent('click'));
    // URL.revokeObjectURL( url ); breaks Firefox...
  }

  saveArrayBuffer(buffer: BlobPart, filename: string): void {
    this.save(new Blob([buffer], { type: 'application/octet-stream' }), filename);
  }

  saveString(text: BlobPart, filename: string): void {
    this.save(new Blob([text], { type: 'text/plain' }), filename);
  }
}
