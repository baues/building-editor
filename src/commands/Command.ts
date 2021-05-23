import { Editor } from '../Editor';

export abstract class Command {
  editor: Editor;
  id: number;
  name: string;
  inMemory?: boolean;
  updatable?: boolean;
  json?: Command;

  abstract type: string;
  abstract execute(): void;
  abstract undo(): void;
  abstract update(command: Command): void;

  constructor(editor: Editor) {
    this.editor = editor;
    this.id = -1;
    this.name = '';
    this.inMemory = false;
    this.updatable = false;
  }

  toJSON(): Command {
    const output: Command = {
      editor: undefined as unknown as Editor,
      type: this.type,
      id: this.id,
      name: this.name,
      execute: this.execute,
      undo: this.undo,
      update: this.update,
      toJSON: this.toJSON,
      fromJSON: this.fromJSON,
    };
    return output;
  }

  fromJSON(json: Command): void {
    this.inMemory = true;
    this.type = json.type;
    this.id = json.id;
    this.name = json.name;
  }
}
