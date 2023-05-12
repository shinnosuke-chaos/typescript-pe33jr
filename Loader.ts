import { BufferGeometry } from 'three';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';

export default class GeometryLoader {
  static selectFromFile(): Promise<BufferGeometry> {
    // select file from local
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.stl;.off;.obj';
    return new Promise((resolve, reject) => {
      input.onchange = (event) => {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (!file) return;
        GeometryLoader.readFileToGeometry(file).then(resolve).catch(reject);
      };
      input.click();
    });
  }
  static async readFileToGeometry(file: File): Promise<BufferGeometry> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const loader = new STLLoader();
        const geometry = loader.parse(reader.result as ArrayBuffer);
        geometry.center();
        geometry.computeBoundingBox();
        resolve(geometry);
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  }
}
