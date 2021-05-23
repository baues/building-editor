import { Editor } from './Editor';
import { Config } from './Config';
import { Command } from './commands/Command';
import * as Commands from './commands';
import { CommandTypes } from './commands/types';

export interface HistoryJson {
  undos: Command[];
  redos: Command[];
}

export class History {
  editor: Editor;
  undos: Command[];
  redos: Command[];
  lastCmdTime: Date;
  idCounter: number;
  config: Config;

  constructor(editor: Editor) {
    this.editor = editor;
    this.undos = [];
    this.redos = [];
    this.lastCmdTime = new Date();
    this.idCounter = 0;
    this.config = editor.config;
  }

  execute(cmd: Command): void {
    const lastCmd = this.undos[this.undos.length - 1];
    const timeDifference = new Date().getTime() - this.lastCmdTime.getTime();

    const isUpdatableCmd = lastCmd?.updatable;

    if (isUpdatableCmd && timeDifference < 500) {
      lastCmd.update(cmd);
      cmd = lastCmd;
    } else {
      this.undos.push(cmd);
      cmd.id = ++this.idCounter;
    }

    cmd.execute();
    cmd.inMemory = true;

    if (this.config.getKey('history')) {
      cmd.json = cmd.toJSON();
    }
    this.lastCmdTime = new Date();
    this.redos = [];
  }

  undo(): Command | undefined {
    let cmd;

    if (this.undos.length > 0) {
      cmd = this.undos.pop();

      if (cmd && !cmd.inMemory && cmd.json) {
        cmd.fromJSON(cmd.json);
      }
    }

    if (cmd) {
      cmd.undo();
      this.redos.push(cmd);
    }

    return cmd;
  }

  redo(): Command | undefined {
    let cmd;

    if (this.redos.length > 0) {
      cmd = this.redos.pop();

      if (cmd && !cmd.inMemory && cmd.json) {
        cmd.fromJSON(cmd.json);
      }
    }

    if (cmd !== undefined) {
      cmd.execute();
      this.undos.push(cmd);
    }

    return cmd;
  }

  toJSON(): HistoryJson {
    const history = {} as History;
    history.undos = [];
    history.redos = [];

    if (!this.config.getKey('history')) {
      return history;
    }

    for (let i = 0; i < this.undos.length; i++) {
      const json = this.undos[i].json;
      if (json) {
        history.undos.push(json);
      }
    }

    for (let j = 0; j < this.redos.length; j++) {
      const json = this.redos[j].json;
      if (json) {
        history.redos.push(json);
      }
    }

    return history;
  }

  fromJSON(json: HistoryJson): void {
    if (json === undefined) return;

    for (let i = 0; i < json.undos.length; i++) {
      const cmdJSON = json.undos[i];
      const cmdType = cmdJSON.type as CommandTypes;
      // @ts-ignore
      const cmd = new Commands[cmdType](this.editor);
      cmd.json = cmdJSON;
      cmd.id = cmdJSON.id;
      cmd.name = cmdJSON.name;
      this.undos.push(cmd);
      this.idCounter = cmdJSON.id > this.idCounter ? cmdJSON.id : this.idCounter;
    }

    for (let j = 0; j < json.redos.length; j++) {
      const cmdJSON = json.redos[j];
      const cmdType = cmdJSON.type as CommandTypes;
      // @ts-ignore
      const cmd = new Commands[cmdType](this.editor);
      cmd.json = cmdJSON;
      cmd.id = cmdJSON.id;
      cmd.name = cmdJSON.name;
      this.redos.push(cmd);
      this.idCounter = cmdJSON.id > this.idCounter ? cmdJSON.id : this.idCounter;
    }
  }

  clear(): void {
    this.undos = [];
    this.redos = [];
    this.idCounter = 0;
  }

  goToState(id: number): void {
    this.editor.editorControls.enabled = false;

    let cmd = this.undos.length > 0 ? this.undos[this.undos.length - 1] : undefined;

    if (cmd === undefined || id > cmd.id) {
      cmd = this.redo();
      while (cmd !== undefined && id > cmd.id) {
        cmd = this.redo();
      }
    } else {
      while (true) {
        cmd = this.undos[this.undos.length - 1];

        if (cmd === undefined || id === cmd.id) break;

        this.undo();
      }
    }

    this.editor.editorControls.enabled = true;
    this.editor.editorControls.update();
  }

  enableSerialization(id: number): void {
    this.goToState(-1);

    this.editor.editorControls.enabled = false;

    let cmd = this.redo();
    while (cmd !== undefined) {
      if (Object.prototype.hasOwnProperty.call(!cmd, 'json')) {
        cmd.json = cmd.toJSON();
      }
      cmd = this.redo();
    }

    this.editor.editorControls.enabled = true;

    this.goToState(id);
  }
}
