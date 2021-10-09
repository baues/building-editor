import * as THREE from 'three';
import { color } from './Color';

export class StencilPlane {
  plane: THREE.Plane;
  stencilPlane: THREE.Mesh<THREE.PlaneBufferGeometry, THREE.MeshStandardMaterial>;

  constructor(plane: THREE.Plane) {
    this.plane = plane;
    const planeGeom = new THREE.PlaneBufferGeometry(1000, 1000);

    const planeMat = new THREE.MeshStandardMaterial({

      color: color.stencilPlane,
      metalness: 0.1,
      roughness: 0.75,

      stencilWrite: true,
      stencilRef: 0,
      stencilFunc: THREE.NotEqualStencilFunc,
      stencilFail: THREE.ReplaceStencilOp,
      stencilZFail: THREE.ReplaceStencilOp,
      stencilZPass: THREE.ReplaceStencilOp,

    });

    this.stencilPlane = new THREE.Mesh(planeGeom, planeMat);
    this.stencilPlane.name = 'building-editor-stencilPlane';
    this.stencilPlane.renderOrder = 10;
    this.stencilPlane.onAfterRender = function (renderer: { clearStencil: () => void }): void {
      renderer.clearStencil();
    };
  }

  update(): void {
    const po = this.stencilPlane;
    this.plane.coplanarPoint(po.position);
    po.lookAt(
      po.position.x - this.plane.normal.x,
      po.position.y - this.plane.normal.y,
      po.position.z - this.plane.normal.z,
    );
  }
}
