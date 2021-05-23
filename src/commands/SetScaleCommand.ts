import { Command } from './Command';

import * as THREE from 'three';
import { Editor } from '../Editor';

class SetScaleCommand extends Command {
  type = 'SetScaleCommand';
  object: THREE.Object3D;
  objectUuid: string;
  oldScale: any;
  newScale: any;

  constructor(editor: Editor, object: THREE.Object3D, newScale: THREE.Vector3, optionalOldScale?: THREE.Vector3) {
    super(editor);
    this.name = 'Set Scale';
    this.updatable = true;
    this.object = object;
    this.objectUuid = object.uuid;
    this.oldScale = object.scale.clone();
    this.newScale = newScale.clone();

    if (optionalOldScale !== undefined) {
      this.oldScale = optionalOldScale.clone();
    }
  }

  execute(): void {
    this.object.scale.copy(this.newScale);
    this.object.updateMatrixWorld(true);
    this.editor.objectChanged(this.object);
  }

  undo(): void {
    this.object.scale.copy(this.oldScale);
    this.object.updateMatrixWorld(true);
    this.editor.objectChanged(this.object);
  }

  update(command: SetScaleCommand): void {
    this.newScale.copy(command.newScale);
  }

  toJSON(): SetScaleCommand {
    const output = super.toJSON() as SetScaleCommand;

    output.objectUuid = this.object.uuid;
    output.oldScale = this.oldScale.toArray();
    output.newScale = this.newScale.toArray();

    return output;
  }

  fromJSON(json: SetScaleCommand): void {
    super.fromJSON(json);

    this.object = this.editor.objectByUuid(json.objectUuid) as THREE.Object3D;
    this.oldScale = new THREE.Vector3().fromArray(json.oldScale);
    this.newScale = new THREE.Vector3().fromArray(json.newScale);
  }
}

export { SetScaleCommand };
