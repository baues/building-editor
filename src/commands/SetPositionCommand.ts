import { Command } from './Command';

import * as THREE from 'three';
import { Editor } from '../Editor';

class SetPositionCommand extends Command {
  type = 'SetPositionCommand';
  object: THREE.Object3D;
  objectUuid: string;
  newPosition: any;
  oldPosition: any;

  constructor(editor: Editor, object: THREE.Object3D, newPosition: THREE.Vector3, optionalOldPosition?: THREE.Vector3) {
    super(editor);
    this.editor = editor;
    this.name = 'Set Position';
    this.updatable = true;
    this.object = object;
    this.objectUuid = this.object.uuid;
    this.newPosition = newPosition.clone();
    this.oldPosition = object.position.clone();

    if (optionalOldPosition !== undefined) {
      this.oldPosition = optionalOldPosition.clone();
    }
  }

  execute(): void {
    this.object.position.copy(this.newPosition);
    this.object.updateMatrixWorld(true);
    this.editor.objectChanged(this.object);
  }

  undo(): void {
    this.object.position.copy(this.oldPosition);
    this.object.updateMatrixWorld(true);
    this.editor.objectChanged(this.object);
  }

  update(command: SetPositionCommand): void {
    this.newPosition.copy(command.newPosition);
  }

  toJSON(): SetPositionCommand {
    const output = super.toJSON() as SetPositionCommand;

    output.objectUuid = this.object.uuid;
    output.oldPosition = this.oldPosition.toArray();
    output.newPosition = this.newPosition.toArray();

    return output;
  }

  fromJSON(json: SetPositionCommand): void {
    super.fromJSON(json);

    this.object = this.editor.objectByUuid(json.objectUuid) as THREE.Object3D;
    this.oldPosition = new THREE.Vector3().fromArray(json.oldPosition);
    this.newPosition = new THREE.Vector3().fromArray(json.newPosition);
  }
}

export { SetPositionCommand };
