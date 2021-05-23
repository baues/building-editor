import { defaultConfig } from './defaultConfig';

export interface BuildingEditorConfig {
  'exportPrecision': number;
  'control/orbitControls/enable': boolean;
  'control/transformControls/enable': boolean;
  'control/viewCubeControls/visible': boolean;
  'control/viewCubeControls/size'?: number;
  'control/viewCubeControls/style'?: string;
  'control/viewCubeControls/perspective'?: boolean;
  'debug': boolean;
  'history': boolean;
  'select/enabled': boolean;
  'redo/enabled': boolean;
  'undo/enabled': boolean;
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
