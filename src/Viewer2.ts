import { Vector3 } from 'three';
import BaseViewer from './BaseViewer';

export default class Viewer2 extends BaseViewer {
  dispose() {
    super.dispose();
    document.removeEventListener('keydown', this.onkeydownListener);
  }
  constructor() {
    super({
      camera: {
        position: new Vector3(0, 0, 8),
        up: new Vector3(0, 1, 0),
        lookAt: new Vector3(0, 0, 0),
      },
    });
    document.addEventListener('keydown', this.onkeydownListener);
  }
}
