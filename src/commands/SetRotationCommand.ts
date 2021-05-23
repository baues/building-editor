import { Command } from './Command';

import * as THREE from 'three';
import { Editor } from '../Editor';

class SetRotationCommand extends Command {
  type = 'SetRotationCommand';
  object: THREE.Object3D
  objectUuid: string;
  oldRotation: any;
  newRotation: any;

  constructor(editor: Editor, object: THREE.Object3D, newRotation: THREE.Euler, optionalOldRotation: THREE.Euler) {
    super(editor);
    this.name = 'Set Rotation';
    this.updatable = true;
    this.object = object;
    this.objectUuid = object.uuid;
    if (object !== undefined && newRotation !== undefined) {
      this.oldRotation = object.rotation.clone();
      this.newRotation = newRotation.clone();
    }
    if (optionalOldRotation !== undefined) {
      this.oldRotation = optionalOldRotation.clone();
    }
  }

  execute(): void {
    this.object.rotation.copy(this.newRotation);
    this.object.updateMatrixWorld(true);
    this.editor.objectChanged(this.object);
  }

  undo(): void {
    this.object.rotation.copy(this.oldRotation);
    this.object.updateMatrixWorld(true);
    this.editor.objectChanged(this.object);
  }

  update(command: SetRotationCommand): void {
    this.newRotation.copy(command.newRotation);
  }

  toJSON(): SetRotationCommand {
    const output = super.toJSON() as SetRotationCommand;

    output.objectUuid = this.object.uuid;
    output.oldRotation = this.oldRotation.toArray();
    output.newRotation = this.newRotation.toArray();

    return output;
  }

  fromJSON(json: SetRotationCommand): void {
    super.fromJSON(json);

    this.object = this.editor.objectByUuid(json.objectUuid) as THREE.Object3D;
    this.oldRotation = new THREE.Euler().fromArray(json.oldRotation);
    this.newRotation = new THREE.Euler().fromArray(json.newRotation);
  }
}

export { SetRotationCommand };
