import { Editor } from './Editor';

export class ContextMenu {
  editor: Editor;
  open: boolean;
  x: number | null;
  y: number | null;
  dispose: () => void;

  constructor(editor: Editor) {
    this.editor = editor;
    this.open = false;
    this.x = null;
    this.y = null;
  
    const onContextMenu = (event: MouseEvent): void | boolean => {
      if (editor.config.getKey('contextmenu/enabled')) {
        event.preventDefault();

        if (this.open) {
          this.hide();
        } else {
          this.show(event.clientX, event.clientY);
        }
      } else {
        return true;
      }
    };

    this.dispose = (): void => {
      editor.renderer.domElement.removeEventListener('contextmenu', onContextMenu, false);
    };

    editor.renderer.domElement.addEventListener('contextmenu', onContextMenu, false);
  }

  show(x: number, y: number): void {
    this.open = true;
    this.x = x;
    this.y = y;
    this.editor.editorControls.update();
  }

  hide(): void {
    this.open = false;
    this.x = null;
    this.y = null;
    this.editor.editorControls.update();
  }
}
