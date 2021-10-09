import * as THREE from 'three';
import { Editor } from './Editor';
import * as Commands from './commands';
import { throttle } from './utils/throttle';
import { getViewSize } from './utils/viewportUtils';

const IS_MAC = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
const onDownPosition = new THREE.Vector2();
const onUpPosition = new THREE.Vector2();
const onDoubleClickPosition = new THREE.Vector2();

export class Event {
  dispose: () => void;

  constructor(editor: Editor) {
    const setSceneSize = (width?: number, height?: number) => {
      if (!width || !height) {
        const size = getViewSize();
        width = size.width;
        height = size.height;
      }

      if (editor.camera instanceof THREE.PerspectiveCamera) {
        editor.camera.aspect = width / height;
        editor.camera.updateProjectionMatrix();
      }
  
      if (editor.renderer.getPixelRatio() !== window.devicePixelRatio) {
        editor.renderer.setPixelRatio(window.devicePixelRatio);
      }
      editor.renderer.setSize(width, height);
  
      editor.render();
    };
    setSceneSize();

    // ResizeListener
    const onWindowResize = (): void => {
      setSceneSize();
    };
    
    // EditorControlsListener    
    const onUpdateEditorControls = (): void => {
      editor.render();
    };
    
    // OrbitControlsListener
    const onChangeOrbitControls = (): void => {
      editor.render();
      editor.viewCubeControls.update();
    };

    // TransformControlsListener
    let objectPositionOnDown: THREE.Vector3 | null = null;
    let objectRotationOnDown: THREE.Euler | null = null;
    let objectScaleOnDown: THREE.Vector3 | null = null;

    const onChangeTransformControls = (): void => {
      const object = editor.transformControls.object;
  
      if (object) {
        editor.selectionBox.setFromObject(object);
  
        const helper = editor.helpers[object.id];
  
        if (helper && !(helper instanceof THREE.SkeletonHelper)) {
          helper.update();
        }
      }
  
      editor.render();
    };

    const onMouseDownTransformControls = (): void => {
      const object = editor.transformControls.object;
      if (!object) return;
  
      objectPositionOnDown = object.position.clone();
      objectRotationOnDown = object.rotation.clone();
      objectScaleOnDown = object.scale.clone();
  
      editor.orbitControls.enabled = false;
    };

    const onMouseUpTransformControls = (): void => {
      const object = editor.transformControls.object;
  
      if (object !== undefined) {
        switch (editor.transformControls.getMode()) {
          case 'translate':
            if (!objectPositionOnDown) break;
            if (!objectPositionOnDown.equals(object.position)) {
              editor.execute(new Commands.SetPositionCommand(editor, object, object.position, objectPositionOnDown));
            }
            break;
  
          case 'rotate':
            if (!objectRotationOnDown) break;
            if (!objectRotationOnDown.equals(object.rotation)) {
              editor.execute(new Commands.SetRotationCommand(editor, object, object.rotation, objectRotationOnDown));
            }
            break;
  
          case 'scale':
            if (!objectScaleOnDown) break;
            if (!objectScaleOnDown.equals(object.scale)) {
              editor.execute(new Commands.SetScaleCommand(editor, object, object.scale, objectScaleOnDown));
            }
            break;
          default:
            if (editor.config.getKey('debug')) {
              console.error('unknown control mode');
            }
            break;
        }
      }
  
      editor.orbitControls.enabled = true;
    };

    // ViewCubeControls
    const DEGTORAD = THREE.MathUtils.DEG2RAD;

    const rotate = (a: number, b: number, c: number): void => {
      const fwd = new THREE.Vector3();
      const euler = new THREE.Euler(a, b, c);
  
      const finishQuaternion = new THREE.Quaternion()
        .copy(editor.camera.quaternion)
        .setFromEuler(euler);
      fwd.set(0, 0, -1);
      fwd.applyQuaternion(finishQuaternion);
      fwd.multiplyScalar(100);
      editor.camera.position.copy(editor.orbitControls.target).sub(fwd);
      editor.orbitControls.update();
    };

    const onClickViewCubeControls = (e: any): void => {
      switch (e.target.id) {
        case 'front':
          rotate(0, 0, 0);
          break;
        case 'back':
          rotate(0, 180 * DEGTORAD, 0);
          break;
        case 'top':
          rotate(-90 * DEGTORAD, 0, 0);
          break;
        case 'bottom':
          rotate(90 * DEGTORAD, 0, 0);
          break;
        case 'left':
          rotate(0, -90 * DEGTORAD, 0);
          break;
        case 'right':
          rotate(0, 90 * DEGTORAD, 0);
          break;
      }
    };
    
    // click
    function getMousePosition(dom: HTMLCanvasElement, x: number, y: number): number[] {
      const rect = dom.getBoundingClientRect();
      return [(x - rect.left) / rect.width, (y - rect.top) / rect.height];
    }
    
    const getIntersects = (point: THREE.Vector2, objects: THREE.Object3D[]): THREE.Intersection[] => {
      editor.mouse.set(point.x * 2 - 1, -(point.y * 2) + 1);
      editor.raycaster.setFromCamera(editor.mouse, editor.camera);
      return editor.raycaster.intersectObjects(objects);
    };

    const select = (object: THREE.Object3D | null) => {
      editor.select(object);
      editor.editorControls.update();
    };
 
    const isVisible = (object: THREE.Object3D): boolean => {
      let bool = object.visible;
  
      if (bool) {
        object.traverseAncestors((parent) => {
          if (!parent.visible) bool = false;
        });
      }
      return bool;
    };

    const click = () => {
      if (!editor.config.getKey('select/enabled')) return;
      if (onDownPosition.distanceTo(onUpPosition) < 1e-3) {
        const objects: THREE.Object3D[] = []; // editor.objects is not accurate in some condition. should fix
        editor.scene.traverse(child => (child instanceof THREE.Mesh && child.name !== 'building-editor-stencilPlane' && isVisible(child)) && objects.push(child));
        const intersects = getIntersects(onUpPosition, objects);
  
        if (intersects.length > 0) {
          let object: THREE.Object3D | null = null;
          for (const intersection of intersects) {
            const iObject = intersection.object;
            object = iObject;
            break;
          }
  
          if (object?.userData.object !== undefined) {
            select(object.userData.object);
          } else {
            select(object);
          }
        } else {
          select(null);
        }
      }
    };

    // PointerUpDownListener
    const onPointerDown = (event: MouseEvent): void => {
      const array = getMousePosition(editor.renderer.domElement, event.clientX, event.clientY);
      onDownPosition.fromArray(array);
    };

    const onPointerUp = (event: MouseEvent): void => {
      const array = getMousePosition(editor.renderer.domElement, event.clientX, event.clientY);
      onUpPosition.fromArray(array);
  
      click();
    };

    // TouchStartEndListener    
    const onTouchStart = (event: TouchEvent): void => {
      const touch = event.changedTouches[0];
  
      const array = getMousePosition(editor.renderer.domElement, touch.clientX, touch.clientY);
      onDownPosition.fromArray(array);
    };
  
    const onTouchEnd = (event: TouchEvent): void => {
      const touch = event.changedTouches[0];
  
      const array = getMousePosition(editor.renderer.domElement, touch.clientX, touch.clientY);
      onUpPosition.fromArray(array);
  
      click();
    };

    const focus = (object: THREE.Object3D) => {
      editor.focus(object);
    };

    // DoubleClickListener  
    const onDoubleClick = (event: MouseEvent): void => {
      const array = getMousePosition(editor.renderer.domElement, event.clientX, event.clientY);
      onDoubleClickPosition.fromArray(array);
  
      const intersects = getIntersects(onDoubleClickPosition, editor.objects);
  
      if (intersects.length > 0) {
        const intersect = intersects[0];
  
        focus(intersect.object);
      }
    };

    // KeyDownListener
    const removeObject = (object: THREE.Object3D) => {
      if (object === null) return;
      const parent = object.parent;
      if (parent !== null) editor.execute(new Commands.RemoveObjectCommand(editor, object));
      editor.editorControls.update();
    };
 
    const removeSelected = (): void => {
      const object = editor.selected;
      if (object === null) return;
      removeObject(object);
    };
  
    const onKeyDown = (event: KeyboardEvent): void => {
      switch (event.key?.toLowerCase()) {
        case 'backspace':
          // event.preventDefault();
          if (editor.config.getKey('delete/enabled')) {
            removeSelected();
          }
          break;
        case 'delete':
          if (editor.config.getKey('delete/enabled')) {
            removeSelected();
          }
          break;
        case editor.config.getKey('shortcuts/translate'):
          editor.changeTransformMode('translate');
          break;
        case editor.config.getKey('shortcuts/rotate'):
          editor.changeTransformMode('rotate');
          break;
        case editor.config.getKey('shortcuts/scale'):
          editor.changeTransformMode('scale');
          break;
        case editor.config.getKey('shortcuts/undo'):
          if (IS_MAC ? event.metaKey : event.ctrlKey) {
            event.preventDefault(); // Prevent browser specific hotkeys
            if (event.shiftKey) {
              editor.redo();
            } else {
              editor.undo();
            }
          }
          break;
        case editor.config.getKey('shortcuts/focus'):
          if (editor.selected !== null) {
            editor.focus(editor.selected);
          }
          break;
        default:
          break;
      }
    };

    // Hover
    const setHovered = (object: THREE.Object3D | null) => {
      editor.setHovered(object);
      editor.editorControls.update();
    };

    const onMouseMove = (event: MouseEvent): void => {
      const array = getMousePosition(editor.renderer.domElement, event.clientX, event.clientY);
      onDoubleClickPosition.fromArray(array);
  
      const intersects = getIntersects(onDoubleClickPosition, editor.objects);
  
      if (intersects.length > 0) {
        const intersect = intersects[0];
        setHovered(intersect.object);
      } else {
        setHovered(null);
      }
    };
    
    // DragDrop  
    const handleDragOver = (event: DragEvent): void => {
      if (!event.dataTransfer) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = 'copy';
    };
  
    const handleDrop = (event: DragEvent): void => {
      if (!event.dataTransfer) return;
      event.preventDefault();
  
      if (event.dataTransfer.types[0] === 'text/plain') return; // Outliner drop
  
      if (event.dataTransfer.items) {
        // DataTransferItemList supports folders
        editor.loader.loadItemList(event.dataTransfer.items as unknown as DataTransferItem[]);
      } else {
        editor.loader.loadFiles(event.dataTransfer.files as unknown as File[]);
      }
    };

    this.dispose = (): void => {
      window.removeEventListener('resize', onWindowResize, false);
      editor.editorControls.removeEventListener('update', onUpdateEditorControls);
      editor.orbitControls.removeEventListener('change', onChangeOrbitControls);
      editor.transformControls.removeEventListener('change', onChangeTransformControls);
      editor.transformControls.removeEventListener('mouseDown', onMouseDownTransformControls);
      editor.transformControls.removeEventListener('mouseUp', onMouseUpTransformControls);
      editor.transformControls.removeEventListener('touchstart', onMouseDownTransformControls);
      editor.transformControls.removeEventListener('touchend', onMouseUpTransformControls);
      editor.viewCubeControls.element.removeEventListener('click', onClickViewCubeControls, false);
      editor.renderer.domElement.removeEventListener('pointerdown', onPointerDown, false);
      editor.renderer.domElement.removeEventListener('pointerup', onPointerUp, false);
      editor.renderer.domElement.removeEventListener('touchstart', onTouchStart, false);
      editor.renderer.domElement.removeEventListener('touchend', onTouchEnd, false);
      editor.renderer.domElement.removeEventListener('dblclick', onDoubleClick, false);
      document.removeEventListener('keydown', onKeyDown, false);
      document.removeEventListener('mousemove', (e) => throttle(onMouseMove, 200, e), false);
      document.removeEventListener('dragover', handleDragOver, false);
      document.removeEventListener('drop', handleDrop, false);
    };

    window.addEventListener('resize', onWindowResize, false);
    editor.editorControls.addEventListener('update', onUpdateEditorControls);
    editor.orbitControls.addEventListener('change', onChangeOrbitControls);
    editor.transformControls.addEventListener('change', onChangeTransformControls);
    editor.transformControls.addEventListener('mouseDown', onMouseDownTransformControls);
    editor.transformControls.addEventListener('mouseUp', onMouseUpTransformControls);
    editor.transformControls.addEventListener('touchstart', onMouseDownTransformControls);
    editor.transformControls.addEventListener('touchend', onMouseUpTransformControls);
    editor.viewCubeControls.element.addEventListener('click', onClickViewCubeControls, false);
    editor.renderer.domElement.addEventListener('pointerdown', onPointerDown, false);
    editor.renderer.domElement.addEventListener('pointerup', onPointerUp, false);
    editor.renderer.domElement.addEventListener('touchstart', onTouchStart, false);
    editor.renderer.domElement.addEventListener('touchend', onTouchEnd, false);
    editor.renderer.domElement.addEventListener('dblclick', onDoubleClick, false);
    document.addEventListener('keydown', onKeyDown, false);
    document.addEventListener('mousemove', (e) => throttle(onMouseMove, 200, e), false);
    document.addEventListener('dragover', handleDragOver, false);
    document.addEventListener('drop', handleDrop, false);
  }
}
