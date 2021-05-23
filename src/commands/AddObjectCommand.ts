import * as THREE from 'three';
import { Command } from './Command';
import { Editor } from '../Editor';

class AddObjectCommand extends Command {
  type = 'AddObjectCommand';
  parent: THREE.Object3D | undefined;
  object: THREE.Object3D | undefined;
  index: number | undefined;

  constructor(editor: Editor, object?: THREE.Object3D, parent?: THREE.Object3D, index?: number) {
    super(editor);
    this.object = object;
    this.parent = parent;
    this.index = index;
    if (object) {
      this.name = 'Add Object: ' + object.name;
    }
  }

  execute(): void {
    if (!this.object) return;
    this.editor.addObject(this.object, this.parent, this.index);
    this.editor.select(this.object);
  }

  undo(): void {
    if (!this.object) return;
    this.editor.removeObject(this.object);
    this.editor.select(null);
  }

  update(): void {}

  toJSON(): AddObjectCommand {
    const output = super.toJSON() as AddObjectCommand;
    if (!this.object) return output;

    output.object = this.object.toJSON();
    return output;
  }

  fromJSON(json: AddObjectCommand): void {
    super.fromJSON(json);

    if (json.object?.uuid) {
      this.object = this.editor.objectByUuid(json.object.uuid);
    } else {
      this.object = undefined;
    }

    if (!this.object) {
      const loader = new THREE.ObjectLoader();
      this.object = loader.parse(json.object);
    }
  }
}

export { AddObjectCommand };
