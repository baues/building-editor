import * as THREE from 'three';
import { Command } from './Command';
import { Editor } from '../Editor';

class RemoveObjectCommand extends Command {
  type = 'RemoveObjectCommand';
  parent: THREE.Object3D | undefined;
  index: number | undefined;
  object: THREE.Object3D | undefined;
  parentUuid: string | undefined;

  constructor(editor: Editor, object?: THREE.Object3D) {
    super(editor);
    this.name = 'Remove Object';
    this.object = object;
    this.parent = object?.parent || undefined;
    this.index = -1;
    if (this.object && this.parent) {
      this.index = this.parent.children.indexOf(this.object);
    }
  }

  execute(): void {
    if (!this.object) return;
    this.editor.removeObject(this.object);
    this.editor.select(null);
  }

  undo(): void {
    if (!this.object) return;
    this.editor.addObject(this.object, this.parent, this.index);
    this.editor.select(this.object);
  }

  update(): void {}

  toJSON(): RemoveObjectCommand {
    const output = super.toJSON() as RemoveObjectCommand;
    if (!this.object) return output;

    output.object = this.object.toJSON();
    output.index = this.index;
    output.parentUuid = this.parent?.uuid;

    return output;
  }

  fromJSON(json: RemoveObjectCommand): void {
    super.fromJSON(json);

    this.parent = this.editor.objectByUuid(json.parentUuid);
    if (!this.parent) {
      this.parent = this.editor.scene;
    }

    this.index = json.index;
    this.object = this.editor.objectByUuid(json.object?.uuid);

    if (!this.object) {
      const loader = new THREE.ObjectLoader();
      this.object = loader.parse(json.object);
    }
  }
}

export { RemoveObjectCommand };
