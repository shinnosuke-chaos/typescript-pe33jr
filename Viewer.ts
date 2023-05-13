import BaseViewer from './BaseViewer';

export default class Viewer extends BaseViewer {
  dispose() {
    super.dispose();
    document.removeEventListener('wheel', this.onwheelListebner);
  }
  constructor() {
    super();
    this.renderer.domElement.addEventListener('wheel', this.onwheelListebner);
  }
}
