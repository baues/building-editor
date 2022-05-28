# building-editor

[![npm version](https://badge.fury.io/js/building-editor.svg)](https://badge.fury.io/js/building-editor)

The goal of this project is to provide base implementation of web 3D editor for building/architecture which can be used easily. The codes are based on [three.js](https://github.com/mrdoob/three.js) editor fork, as we respect the great work of three.js.

> Note: This project is under development. Please remember that there would be breaking changes. Or you can join us to make this project better for users.

## Installation

```
npm install building-editor
```

## Usage

[Sample code](https://codesandbox.io/s/sad-fast-t1eh0)

```js
import { Editor } from 'building-editor';

const editor = new Editor();
document.body.appendChild(editor.renderer.domElement);

const init = () => {
  const width = window.innerWidth;
  const height = window.innerHeight;
  editor.renderer.setPixelRatio(window.devicePixelRatio);
  editor.renderer.setSize(width, height);
  editor.render();
}

init();
```

## API

### Editor

The main API of this library to create web 3D editor. This includes properties and actions. Note that you need to implement user interactions such as selected, hovered etc., using addEventListener since Editor itself does not provide it.

#### Constructor

##### Editor(config:[Config](#Config),settings:[Settings](#Settings)). 

This creates a new Editor.  

config - configuration data to specify cotrolability of editor (e.g. undo/redo, delete etc).  
settings - setting data which summarize view setting such as renderer, camera, scene etc.  

#### Properties and Methods.  

##### .config:[Config](#Config). 
configuration data to specify cotrolability of editor (e.g. undo/redo, delete etc).  

##### .settings:[Settings](#Settings).  
setting data which summarize view setting such as renderer, camera, scene etc.  

##### .editorControls:[EditorControls](#EditorControls).  
extension of [THREE.EventDispatcher](https://threejs.org/docs/#api/en/core/EventDispatcher)    

##### .renderer:[THREE.WebGLRenderer](https://threejs.org/docs/index.html?q=webGL#api/en/renderers/WebGLRenderer).  

##### .DEFAULT_CAMERA:[THREE.Camera](https://threejs.org/docs/#api/en/cameras/Camera).  

##### .history:[History](#History).  
Manage undo/redo history  

##### .exporter:[Exporter](#Exporter).  
Utility class to export geometry in different format (e.g. obj, stl, dae etc)  

##### .loader:[Loader](#Loader).  
Utility class to load geometry file into editor  

##### .camera:[THREE.Camera](https://threejs.org/docs/#api/en/cameras/Camera).  

##### .scene:[THREE.Scene](https://threejs.org/docs/?q=scene#api/en/scenes/Scene).  

##### .sceneHelpers:[THREE.Scene](https://threejs.org/docs/?q=scene#api/en/scenes/Scene).  

##### .objects:[THREE.Object3D[]](https://threejs.org/docs/?q=object3#api/en/core/Object3D).  

##### .INITIAL_OBJECTS:[THREE.Object3D[]](https://threejs.org/docs/?q=object3#api/en/core/Object3D).  

##### .INITIAL_HELPERS:[THREE.Object3D[]](https://threejs.org/docs/?q=object3#api/en/core/Object3D).  

##### .geometries:{[index:string]:[THREE.BufferGeometry](https://threejs.org/docs/?q=geometr#api/en/core/BufferGeometry)}   

##### .materials:{[index:string]:[THREE.Material](https://threejs.org/docs/?q=material#api/en/constants/Materials)}   

##### .textures:{[index:string]:[THREE.Texture](https://threejs.org/docs/?q=material#api/en/constants/Textures)}   

##### .materialsRefCounter

##### Config(config?:[BuildingEditorConfig](#BuildingEditorConfig)).  

##### BuildingEditorConfig. 

Editor has many properties and methods. Please check [Editor class](https://github.com/baues/building-editor/blob/main/src/Editor.ts) to find them. The documents will be prepared later.
