import { Editor } from '../Editor';
import { Command } from './Command';

class SetUuidCommand extends Command {
  type = 'SetUuidCommand';
  oldUuid?: string;
  newUuid?: string;
  object: any;

  constructor(editor: Editor, object: THREE.Object3D, newUuid: string) {
    super(editor);
    this.name = 'Update UUID';
    this.object = object;
    this.oldUuid = object !== undefined ? object.uuid : undefined;
    this.newUuid = newUuid;
  }

  execute() {
    if (!this.object || !this.newUuid) return;

    this.object.uuid = this.newUuid;
    this.editor.objectChanged(this.object);
  }

  undo() {
    if (!this.object || !this.oldUuid) return;

    this.object.uuid = this.oldUuid;
    this.editor.objectChanged(this.object);
  }

  update(): void {}

  toJSON(): SetUuidCommand {
    const output = super.toJSON() as SetUuidCommand;

    output.oldUuid = this.oldUuid;
    output.newUuid = this.newUuid;

    return output;
  }

  fromJSON(json: SetUuidCommand): void {
    super.fromJSON(json);

    this.oldUuid = json.oldUuid;
    this.newUuid = json.newUuid;
    this.object = this.editor.objectByUuid(json.oldUuid);

    if (this.object === undefined) {
      this.object = this.editor.objectByUuid(json.newUuid);
    }
  }
}

export { SetUuidCommand };
