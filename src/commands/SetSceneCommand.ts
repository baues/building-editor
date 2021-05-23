import { Command } from './Command';
import { SetUuidCommand } from './SetUuidCommand';
import { SetValueCommand } from './SetValueCommand';
import { AddObjectCommand } from './AddObjectCommand';
import { Editor } from '../Editor';

class SetSceneCommand extends Command {
  type = 'SetSceneCommand';
  cmdArray: Command[];
  cmds?: Command[];

  constructor(editor: Editor, scene?: THREE.Scene) {
    super(editor);
    this.name = 'Set Scene';
    this.cmdArray = [];
    if (scene !== undefined) {
      this.cmdArray.push(new SetUuidCommand(this.editor, this.editor.scene, scene.uuid));
      this.cmdArray.push(new SetValueCommand(this.editor, this.editor.scene, 'name', scene.name));
      this.cmdArray.push(new SetValueCommand(this.editor, this.editor.scene, 'userData', JSON.parse(JSON.stringify(scene.userData))));
      while (scene.children.length > 0) {
        const child = scene.children.pop();
        child && this.cmdArray.push(new AddObjectCommand(this.editor, child));
      }
    }
  }

  execute(): void {
    this.editor.editorControls.enabled = false;

    for (let i = 0; i < this.cmdArray.length; i++) {
      this.cmdArray[i].execute();
    }

    this.editor.editorControls.enabled = true;
    this.editor.editorControls.update();
  }

  undo(): void {
    this.editor.editorControls.enabled = false;

    for (let i = this.cmdArray.length - 1; i >= 0; i--) {
      this.cmdArray[i].undo();
    }

    this.editor.editorControls.enabled = true;
    this.editor.editorControls.update();
  }

  update(): void {}

  toJSON(): SetSceneCommand {
    const output = super.toJSON() as SetSceneCommand;

    const cmds = [];
    for (let i = 0; i < this.cmdArray.length; i++) {
      cmds.push(this.cmdArray[i].toJSON());
    }
    output.cmds = cmds;

    return output;
  }

  fromJSON(json: SetSceneCommand): void {
    super.fromJSON(json);

    const cmds = json.cmds;
    if (cmds) {
      for (let i = 0; i < cmds.length; i++) {
        const cmd = new (window as any)[cmds[i].type](); // creates a new object of type "json.type"
        cmd.fromJSON(cmds[i]);
        this.cmdArray.push(cmd);
      }
    }
  }
}

export { SetSceneCommand };
