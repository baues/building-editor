import * as THREE from 'three';

export class EditorControls extends THREE.EventDispatcher {
  enabled: boolean;
  updateEvent: { type: string };

  constructor() {
    super();

    this.enabled = true;
    this.updateEvent = { type: 'update' };
  }

  update(): void {
    if (!this.enabled) return;
    this.dispatchEvent(this.updateEvent);
  }
}
