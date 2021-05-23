export interface Color {
  'selectionBox': string | number | THREE.Color | undefined;
  'picker': string | number | THREE.Color | undefined;
  'scene/background': string | number | THREE.Color | undefined;
  'gridHelper': number | THREE.Color | undefined;
  'planeHelper': number | undefined;
  'stencilPlane': number | undefined;
}

export const color: Color = {
  'selectionBox': 0xffffc107,
  'picker': 0xff0000,
  'scene/background': 0xf0f0f0,
  'gridHelper': 0x666666,
  'planeHelper': 0x666666,
  'stencilPlane': 0x00bbff,
};
