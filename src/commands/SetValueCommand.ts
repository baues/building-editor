import { Editor } from '../Editor';
import { Command } from './Command';

class SetValueCommand extends Command {
  type = 'SetValueCommand';
  oldValue: any;
  newValue: any;
  objectUuid?: string;
  attributeName: string;
  object: THREE.Object3D | undefined;

  constructor(editor: Editor, object: THREE.Object3D, attributeName: string, newValue: any) {
    super(editor);
    this.name = 'Set ' + attributeName;
    this.updatable = true;
    this.object = object;
    this.attributeName = attributeName;
    this.oldValue = object ? (object as any)[this.attributeName] : undefined;
    this.newValue = newValue;
  }

  execute(): void {
    if (!this.object || !this.attributeName) return;

    (this.object as any)[this.attributeName] = this.newValue;
    this.editor.objectChanged(this.object);
  }

  undo(): void {
    if (!this.object || !this.attributeName) return;

    (this.object as any)[this.attributeName] = this.oldValue;
    this.editor.objectChanged(this.object);
  }

  update(cmd: SetValueCommand): void {
    this.newValue = cmd.newValue;
  }

  toJSON(): SetValueCommand {
    const output = super.toJSON() as SetValueCommand;

    output.objectUuid = this.object?.uuid;
    output.attributeName = this.attributeName;
    output.oldValue = this.oldValue;
    output.newValue = this.newValue;

    return output;
  }

  fromJSON(json: SetValueCommand): void {
    super.fromJSON(json);

    this.attributeName = json.attributeName;
    this.oldValue = json.oldValue;
    this.newValue = json.newValue;
    this.object = this.editor.objectByUuid(json.objectUuid);
  }
}

export { SetValueCommand };
