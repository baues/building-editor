export interface THREEJsonMetaData {
  metadata: {
    type: string;
    version?: number;
    formatVersion?: number;
  };
}
export type THREEJson = THREEJsonMetaData & { [index: string]: any };
