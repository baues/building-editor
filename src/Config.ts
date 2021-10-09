import { defaultConfig } from './defaultConfig';

// eslint-disable-next-line max-len
export type Key = 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g' | 'h' | 'i' | 'j' | 'k' | 'l' | 'm' | 'n' | 'o' | 'p' | 'q' | 'r' | 's' | 't' | 'u' | 'v' | 'w' | 'x' | 'y' | 'z' | '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9';

export interface BuildingEditorConfig {
  'exportPrecision': number;
  'control/orbitControls/enable': boolean;
  'control/transformControls/enable': boolean;
  'control/viewCubeControls/visible': boolean;
  'control/viewCubeControls/size'?: number;
  'control/viewCubeControls/style'?: string;
  'control/viewCubeControls/perspective'?: boolean;
  'control/viewCubeControls/northDirection'?: number; // relative north direction [rad]
  'debug': boolean;
  'history': boolean;
  'select/enabled': boolean;
  'redo/enabled': boolean;
  'undo/enabled': boolean;
  'delete/enabled': boolean;
  'contextmenu/enabled': boolean;
  'shortcuts/translate': Key;
  'shortcuts/rotate': Key;
  'shortcuts/scale': Key;
  'shortcuts/undo': Key;
  'shortcuts/focus': Key;
}

export type EditorConfig = Partial<BuildingEditorConfig>;

export class Config {
  name: string;
  config: BuildingEditorConfig;

  constructor(config?: EditorConfig) {
    this.name = 'building-editor';

    const initialConfig: BuildingEditorConfig = defaultConfig;
    this.config = initialConfig;

    if (window.localStorage[this.name] === undefined) {
      window.localStorage[this.name] = JSON.stringify(initialConfig);
      this.config = {
        ...initialConfig,
        ...config,
      };
    } else {
      const localStorageData = JSON.parse(window.localStorage[this.name]);

      this.config = {
        ...initialConfig,
        ...localStorageData,
        ...config,
      };
    }
  }

  getKey<K extends keyof BuildingEditorConfig>(key: K): BuildingEditorConfig[K] {
    return this.config[key];
  }

  set(config: EditorConfig): void {
    this.config = {
      ...this.config,
      ...config,
    };
    window.localStorage[this.name] = JSON.stringify(this.config);

    if (this.config.debug) {
      const dateTime = /\d\d:\d\d:\d\d/.exec(new Date().toString());
      dateTime && console.log('[' + dateTime[0] + ']', 'Saved config to LocalStorage.');
    }
  }

  clear(): void {
    window.localStorage.clear();
    delete window.localStorage[this.name];
  }
}
