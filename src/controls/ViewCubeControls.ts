import * as THREE from 'three';
import { Config } from '../Config';

const defaultStyle = `
.viewCubeControls {
    font-family: sans-serif;
    transform: scaleY(-1);
    -webkit-touch-callout: none;
    -webkit-user-select: none;
    -khtml-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
}

.viewCubeControls > .box {
    position: relative;
    transform-style: preserve-3d;
}

.viewCubeControls > .box > .face {
    cursor: grab;
    background-color: #fff;
    position: absolute;
    box-shadow: inset 0 0 0 1px #222;
    font-weight: bold;
    color: #222;
    text-align: center;
}

.viewCubeControls > .box > .face:hover {
    background-color: #ddd;
    cursor: pointer;
}

.viewCubeControls > .box > .ring {
    pointer-events: none;
    position: absolute;
    border-radius: 100%;
    box-shadow: inset 0 0 0 1px #222, 0 0 0 1px #ddd;
    background-color: #fff;
}
.viewCubeControls > .box > .ring > div {
    color: #222;
    position: absolute;
    font-weight: bold;
}
`;

export class ViewCubeControls {
  static cssElement: HTMLStyleElement;
  element: HTMLDivElement;
  size: number;
  style: string;
  perspective: boolean;
  visible: boolean;
  update: () => void;

  constructor(config: Config, camera: THREE.Camera) {
    this.size = config.getKey('control/viewCubeControls/size') || 40;
    this.style = config.getKey('control/viewCubeControls/style') || defaultStyle;
    this.perspective = config.getKey('control/viewCubeControls/perspective') || false;
    this.visible = config.getKey('control/viewCubeControls/visible');

    const size = this.size;
    const style = this.style;

    function epsilon(value: number): number {
      return Math.abs(value) < 1e-10 ? 0 : value;
    }

    function getObjectCSSMatrix(matrix: THREE.Matrix4): string {
      const elements = matrix.elements;
      const matrix3d =
        'matrix3d(' +
        epsilon(elements[0]) +
        ',' +
        epsilon(elements[1]) +
        ',' +
        epsilon(elements[2]) +
        ',' +
        epsilon(elements[3]) +
        ',' +
        epsilon(-elements[4]) +
        ',' +
        epsilon(-elements[5]) +
        ',' +
        epsilon(-elements[6]) +
        ',' +
        epsilon(-elements[7]) +
        ',' +
        epsilon(elements[8]) +
        ',' +
        epsilon(elements[9]) +
        ',' +
        epsilon(elements[10]) +
        ',' +
        epsilon(elements[11]) +
        ',' +
        epsilon(elements[12]) +
        ',' +
        epsilon(elements[13]) +
        ',' +
        epsilon(elements[14]) +
        ',' +
        epsilon(elements[15]) +
        ')';

      return 'translate(-50%,-50%)' + matrix3d;
    }

    const matrix = new THREE.Matrix4();

    const sides = {
      front: 'rotateY(  0deg) translateZ(%SIZE)',
      right: 'rotateY( 90deg) translateZ(%SIZE)',
      back: 'rotateY(180deg) translateZ(%SIZE)',
      left: 'rotateY(-90deg) translateZ(%SIZE)',
      top: 'rotateX( 90deg) translateZ(%SIZE)',
      bottom: 'rotateX(-90deg) translateZ(%SIZE)',
    };

    const offsets = {
      s: [0, -1],
      w: [1, 0],
      n: [0, 1],
      e: [-1, 0],
    };

    this.size = size;

    const unit = 'px';

    if (!ViewCubeControls.cssElement) {
      const head = document.head || document.getElementsByTagName('head')[0];
      const element = document.createElement('style');

      element.id = 'viewCubeControls';
      // element.href = undefined;
      element.appendChild(document.createTextNode(style));

      head.insertBefore(element, head.firstChild);

      ViewCubeControls.cssElement = element;
    }

    // Container
    const container = document.createElement('div');

    container.className = 'viewCubeControls';

    container.style.width = size + unit;
    container.style.height = size + unit;

    // Box
    const box = document.createElement('div');

    box.className = 'box';
    box.style.width = size + unit;
    box.style.height = size + unit;
    box.style.fontSize = size / 6 + unit;
    box.style.display = this.visible ? 'block' : 'none';

    container.appendChild(box);

    // Ring + cardinal points
    const ring = document.createElement('div');

    const R = Math.PI * 0.8;
    const s = (size * R) / 2;

    const directions = {
      s: 'translateX(' + s + unit + ') translateY(' + 0 + unit + ')',
      w: 'translateX(' + s * 2 + unit + ') translateY(' + s + unit + ')',
      n: 'translateX(' + s + unit + ') translateY(' + s * 2 + unit + ')',
      e: 'translateX(' + 0 + unit + ') translateY(' + s + unit + ')',
    };

    function direction(name: 'N' | 'E' | 'S' | 'W'): void {
      const e = document.createElement('div');

      const id = name.toLowerCase() as keyof typeof directions;

      const fs = size / 6;

      e.id = id;
      e.textContent = name;
      e.style.transform = directions[id];
      e.style.fontSize = fs + unit;
      e.style.left = -size / 2 / 6 - offsets[id][0] * fs + unit;
      e.style.top = -size / 2 / 6 - offsets[id][1] * fs + unit;

      ring.appendChild(e);
    }

    direction('N');
    direction('E');
    direction('S');
    direction('W');

    ring.className = 'ring';
    ring.style.transform = 'rotateX(90deg) translateZ(' + (s - size) + unit + ') translateX(' + (-(s * 8 / Math.PI - size) / 3) + unit + ')'; // should calc
    ring.style.width = size * R + unit;
    ring.style.height = size * R + unit;

    box.appendChild(ring);

    // Sides
    function plane(side: 'Front' | 'Right' | 'Back' | 'Left' | 'Top' | 'Bottom'): HTMLDivElement {
      const e = document.createElement('div');

      const id = side.toLowerCase() as keyof typeof sides;

      e.id = id;
      e.textContent = side;
      e.className = id + ' face';

      e.style.width = size + unit;
      e.style.height = size + unit;
      e.style.transform = sides[id].replace('%SIZE', size / 2 + unit);
      e.style.lineHeight = size + unit;

      box.appendChild(e);

      return e;
    }

    plane('Front');
    plane('Right');
    plane('Back');
    plane('Left');
    plane('Top');
    plane('Bottom');

    this.element = container;

    this.update = (): void => {
      const size = this.size;
      const half = size / 2;
      matrix.copy(camera.matrixWorldInverse);

      matrix.elements[12] = half;
      matrix.elements[13] = half;
      matrix.elements[14] = 0;

      const style = getObjectCSSMatrix(matrix);

      box.style.transform = style;
      box.style.display = this.visible ? 'block' : 'none';

      container.style.perspective = (this.perspective && camera instanceof THREE.PerspectiveCamera
        ? Math.pow(size * size + size * size, 0.5) / Math.tan(((camera.fov / 2) * Math.PI) / 180) : 0) + unit;
    };
  }
}
